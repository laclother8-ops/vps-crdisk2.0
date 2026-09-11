import { 
  Call, 
  CallOutcomeStatus, 
  DialerQueueItem, 
  FollowupTriggerType, 
  PowerDialerSession, 
  WSEventType 
} from '@omnicrm/shared';
import { DispositionManager, TwilioTelephonyAdapter } from '@omnicrm/telephony';
import { initialSeedData } from '@omnicrm/database/dist/seed.js';
import { WebSocketGateway } from '../../websocket/ws.gateway.js';
import { crmService } from '../crm/crm.service.js';
import { config } from '../../config.js';

class TelephonyRepository {
  private adapter: TwilioTelephonyAdapter;
  private calls: Call[] = [...(initialSeedData.calls as any[])];
  private activeCall: Call | null = null;
  private activePowerSession: PowerDialerSession | null = null;

  constructor() {
    this.adapter = new TwilioTelephonyAdapter(config.twilio);
  }

  getWebRTCToken(identity = 'agent-carlos') {
    return this.adapter.generateWebRTCAccessToken(identity);
  }

  async listCalls(): Promise<Call[]> {
    const leadsRes = await crmService.listLeads({ limit: 100 });
    return this.calls.map(c => ({
      ...c,
      lead: leadsRes.data.find(l => l.id === c.leadId) || null
    }));
  }

  getActiveCall(): Call | null {
    return this.activeCall;
  }

  async initiateCall(leadId: string): Promise<Call> {
    const lead = await crmService.getLeadById(leadId);
    if (!lead) throw new Error('Lead não encontrado.');

    const call: Call = {
      id: `call-${Date.now()}`,
      leadId: lead.id,
      agentId: '22222222-2222-2222-2222-222222222222',
      duration: 0,
      status: CallOutcomeStatus.ATENDIDA,
      notes: null,
      recordingUrl: null,
      lead,
      createdAt: new Date()
    };

    this.activeCall = call;
    this.calls.unshift(call);

    WebSocketGateway.getInstance().broadcast(WSEventType.DIALER_CALL_INCOMING, call);
    return call;
  }

  async transferCall(callId: string, target: string, type: 'blind' | 'warm' = 'blind'): Promise<{ success: boolean; message: string }> {
    console.log(`[Telephony WebRTC] Transferring call ${callId} to target "${target}" (${type})`);
    
    if (this.activeCall && this.activeCall.id === callId) {
      this.activeCall.notes = `${this.activeCall.notes || ''} [Transferida para ${target}]`;
    }

    WebSocketGateway.getInstance().broadcast(WSEventType.DIALER_CALL_STATUS, {
      callId,
      status: 'TRANSFERRED',
      target,
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      message: `Chamada ${callId} transferida com sucesso para o ramal/número ${target}.`
    };
  }

  async registerCallOutcome(
    callId: string, 
    status: CallOutcomeStatus, 
    duration = 0, 
    notes?: string, 
    recordingUrl?: string
  ): Promise<Call> {
    let call = this.calls.find(c => c.id === callId);
    if (!call) {
      const leadsRes = await crmService.listLeads();
      const firstLeadId = leadsRes.data[0]?.id || 'lead-default';
      call = {
        id: callId,
        leadId: firstLeadId,
        duration,
        status,
        notes: notes || null,
        recordingUrl: recordingUrl || null,
        createdAt: new Date()
      };
      this.calls.unshift(call);
    } else {
      call.status = status;
      call.duration = duration;
      call.notes = notes || null;
      if (recordingUrl) call.recordingUrl = recordingUrl;
    }

    this.activeCall = null;

    // Update Lead last_call_status
    await crmService.updateContactStatus(call.leadId, undefined as any, undefined, status);

    // Trigger proactive followup queue / internal webhook on negative or positive outcome
    const dispositionAction = DispositionManager.processOutcome(status, notes);
    if (dispositionAction.suggestedFollowupTrigger) {
      console.log(`[Telephony Webhook Event] Emitting Follow-up trigger: ${dispositionAction.suggestedFollowupTrigger} for lead ${call.leadId}`);
      await crmService.enqueueFollowup(
        call.leadId,
        dispositionAction.suggestedFollowupTrigger,
        dispositionAction.scheduleDelayMinutes || 10
      );
    }

    // Update Power Dialer session if active
    if (this.activePowerSession) {
      const currentItem = this.activePowerSession.queue[this.activePowerSession.currentIndex];
      if (currentItem && currentItem.leadId === call.leadId) {
        currentItem.status = (status === CallOutcomeStatus.ATENDIDA || status === CallOutcomeStatus.REUNIAO_AGENDADA) ? 'COMPLETED' : 'FAILED';
        currentItem.lastOutcome = status as any;
        currentItem.callDuration = duration;
        this.activePowerSession.totalCalls += 1;
        if (status === CallOutcomeStatus.ATENDIDA || status === CallOutcomeStatus.REUNIAO_AGENDADA) {
          this.activePowerSession.successfulContacts += 1;
        }
        if (status === CallOutcomeStatus.REUNIAO_AGENDADA) {
          this.activePowerSession.scheduledMeetings += 1;
        }
      }
    }

    WebSocketGateway.getInstance().broadcast(WSEventType.DIALER_CALL_ENDED, call);
    return call;
  }

  // --- Power Dialer Engine ---

  async startPowerDialer(leadIds: string[]): Promise<PowerDialerSession> {
    const leadsRes = await crmService.listLeads({ limit: 200 });
    const selectedLeads = leadsRes.data.filter(l => leadIds.includes(l.id));

    const queue: DialerQueueItem[] = selectedLeads.map((lead, idx) => ({
      id: `queue-${idx + 1}`,
      leadId: lead.id,
      lead,
      status: 'PENDING',
      attempts: 0
    }));

    this.activePowerSession = {
      id: `session-${Date.now()}`,
      name: `Sessão de Discagem Automática (${selectedLeads.length} leads)`,
      queue,
      currentIndex: 0,
      status: 'RUNNING',
      countdownSeconds: 3,
      totalCalls: 0,
      successfulContacts: 0,
      scheduledMeetings: 0
    };

    // Auto-dial the first lead
    if (queue.length > 0) {
      queue[0].status = 'IN_CALL';
      queue[0].attempts += 1;
      await this.initiateCall(queue[0].leadId);
    }

    WebSocketGateway.getInstance().broadcast(WSEventType.DIALER_QUEUE_NEXT, {
      session: this.activePowerSession,
      currentLead: queue[0]?.lead || null
    });

    return this.activePowerSession;
  }

  getPowerDialerSession(): PowerDialerSession | null {
    return this.activePowerSession;
  }

  async nextPowerDialerLead(): Promise<{ session: PowerDialerSession; nextLead: any } | { session: null; finished: boolean }> {
    if (!this.activePowerSession) {
      return { session: null, finished: true };
    }

    this.activePowerSession.currentIndex += 1;

    if (this.activePowerSession.currentIndex >= this.activePowerSession.queue.length) {
      this.activePowerSession.status = 'COMPLETED';
      return { session: this.activePowerSession, finished: true } as any;
    }

    const nextItem = this.activePowerSession.queue[this.activePowerSession.currentIndex];
    nextItem.status = 'IN_CALL';
    nextItem.attempts += 1;

    const call = await this.initiateCall(nextItem.leadId);

    WebSocketGateway.getInstance().broadcast(WSEventType.DIALER_QUEUE_NEXT, {
      session: this.activePowerSession,
      currentLead: nextItem.lead
    });

    return { session: this.activePowerSession, nextLead: nextItem.lead };
  }

  pausePowerDialer(): PowerDialerSession | null {
    if (this.activePowerSession) {
      this.activePowerSession.status = 'PAUSED';
    }
    return this.activePowerSession;
  }

  stopPowerDialer(): void {
    this.activePowerSession = null;
  }
}

export const telephonyService = new TelephonyRepository();
