import { 
  FollowupQueueItem, 
  FollowupQueueStatus, 
  FollowupTriggerType, 
  FunnelStage, 
  MessageChannel, 
  MessageSender, 
  WSEventType 
} from '@omnicrm/shared';
import { crmService } from './crm.service.js';
import { aiService } from '../ai/ai.service.js';
import { chatService } from '../chat/chat.service.js';
import { WebSocketGateway } from '../../websocket/ws.gateway.js';

export class FollowupWorker {
  private intervalId: NodeJS.Timeout | null = null;
  private isProcessing = false;

  /**
   * Evaluates if a given date/time is within commercial hours in Brazil (Mon-Fri, 09:00 to 19:00, UTC-3)
   */
  isCommercialHours(date: Date = new Date()): boolean {
    // Convert to America/Sao_Paulo (UTC-3)
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Sao_Paulo',
      hour12: false,
      weekday: 'short',
      hour: 'numeric',
      minute: 'numeric'
    });

    const parts = formatter.formatToParts(date);
    const weekdayPart = parts.find(p => p.type === 'weekday')?.value; // 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'
    const hourPart = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
    const minutePart = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);

    const isWeekend = weekdayPart === 'Sat' || weekdayPart === 'Sun';
    if (isWeekend) return false;

    const timeInMinutes = hourPart * 60 + minutePart;
    const startOfDay = 9 * 60; // 09:00
    const endOfDay = 19 * 60;  // 19:00

    return timeInMinutes >= startOfDay && timeInMinutes <= endOfDay;
  }

  /**
   * Calculates the next business day at 09:15 (America/Sao_Paulo)
   */
  getNextCommercialSlot(fromDate: Date = new Date()): Date {
    // Start with candidate date + 1 day
    const candidate = new Date(fromDate.getTime());
    candidate.setMinutes(15);
    candidate.setSeconds(0);
    candidate.setMilliseconds(0);

    // Get current time in Sao Paulo
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Sao_Paulo',
      hour12: false,
      weekday: 'short',
      hour: 'numeric'
    });

    const parts = formatter.formatToParts(candidate);
    const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
    const weekday = parts.find(p => p.type === 'weekday')?.value;

    // If it's earlier than 09:00 on a weekday today, we can reschedule to 09:15 TODAY
    if (weekday !== 'Sat' && weekday !== 'Sun' && hour < 9) {
      const todaySlot = new Date(candidate.getTime());
      // Adjust to 09:15 today in local/Sao Paulo
      const diffHours = 9 - hour;
      todaySlot.setHours(todaySlot.getHours() + diffHours);
      return todaySlot;
    }

    // Otherwise advance day by day until we find next weekday
    let target = new Date(candidate.getTime());
    // Move to tomorrow
    target.setDate(target.getDate() + 1);

    while (true) {
      const checkParts = formatter.formatToParts(target);
      const checkDay = checkParts.find(p => p.type === 'weekday')?.value;
      if (checkDay !== 'Sat' && checkDay !== 'Sun') {
        break;
      }
      target.setDate(target.getDate() + 1);
    }

    // Set target hour to 09:15 Sao Paulo time (approx UTC-3 -> 12:15 UTC)
    // To be exact across DST or offsets:
    target.setHours(9, 15, 0, 0);
    return target;
  }

  /**
   * Starts background recurring cron checking queue every 5 minutes
   */
  startCron(intervalMs = 5 * 60 * 1000): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    console.log(`[Followup Worker] Starting automated background follow-up worker (Interval: ${intervalMs / 1000}s)...`);
    
    // Run an initial check after 5 seconds
    setTimeout(() => {
      this.processPendingQueue().catch(err => console.error('[Followup Worker Error]', err));
    }, 5000);

    this.intervalId = setInterval(() => {
      this.processPendingQueue().catch(err => console.error('[Followup Worker Error]', err));
    }, intervalMs);
  }

  stopCron(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('[Followup Worker] Stopped.');
    }
  }

  /**
   * Main Worker Execution Loop
   */
  async processPendingQueue(): Promise<{
    processed: number;
    executed: number;
    rescheduled: number;
    cancelled: number;
    skipped: number;
  }> {
    if (this.isProcessing) {
      console.log('[Followup Worker] Already processing queue, skipping cycle.');
      return { processed: 0, executed: 0, rescheduled: 0, cancelled: 0, skipped: 0 };
    }

    this.isProcessing = true;
    let executed = 0;
    let rescheduled = 0;
    let cancelled = 0;
    let skipped = 0;

    try {
      // 1. Sweeper: Check stagnant proposals (>24h in PROPOSTA without action)
      await this.checkStagnantProposals();

      // 2. Fetch pending followups where scheduledFor <= NOW()
      const pendingItems = await crmService.getPendingFollowups();
      console.log(`[Followup Worker] Found ${pendingItems.length} pending follow-up items ready for processing.`);

      const isBusinessHoursNow = this.isCommercialHours();

      for (const item of pendingItems) {
        const lead = await crmService.getLeadById(item.leadId);

        // Security Check 1: Lead existence
        if (!lead) {
          await crmService.updateFollowupStatus(item.id, FollowupQueueStatus.CANCELADO, 'Lead não encontrado no banco');
          cancelled++;
          continue;
        }

        // Security Check 2: Opt-out verification
        if (lead.optOut) {
          console.log(`[Followup Worker] Cancelling follow-up ${item.id}: Lead ${lead.name} is OPT-OUT.`);
          await crmService.updateFollowupStatus(item.id, FollowupQueueStatus.CANCELADO, 'Lead marcou opt-out (LGPD/Privacidade)');
          cancelled++;
          continue;
        }

        // Security Check 3: Human Support active
        const isInHumanMode = chatService.isLeadInHumanMode(lead.id) || lead.status === ('em_atendimento_humano' as any);
        if (isInHumanMode) {
          console.log(`[Followup Worker] Lead ${lead.name} is in HUMAN SUPPORT. Postponing automatic message.`);
          const postponeDate = new Date(Date.now() + 60 * 60 * 1000); // Try again in 1h
          await crmService.rescheduleFollowup(item.id, postponeDate);
          rescheduled++;
          continue;
        }

        // Security Check 4: Recent message from lead (after follow-up was scheduled)
        const lastLeadMsgTime = chatService.getLastLeadMessageTime(lead.id);
        if (lastLeadMsgTime && lastLeadMsgTime.getTime() > new Date(item.createdAt).getTime()) {
          console.log(`[Followup Worker] Cancelling follow-up ${item.id}: Lead ${lead.name} already sent a message after scheduling.`);
          await crmService.updateFollowupStatus(item.id, FollowupQueueStatus.CANCELADO, 'Lead interagiu recentemente no chat');
          cancelled++;
          continue;
        }

        // Security Check 5: Commercial Hours Validation (Mon-Fri, 09:00 - 19:00)
        if (!isBusinessHoursNow) {
          const nextSlot = this.getNextCommercialSlot();
          console.log(`[Followup Worker] Outside commercial hours. Rescheduling follow-up ${item.id} for lead ${lead.name} to ${nextSlot.toISOString()}`);
          await crmService.rescheduleFollowup(item.id, nextSlot);
          rescheduled++;
          continue;
        }

        // Execution: Generate Contextual AI Message
        console.log(`[Followup Worker] Dispatching AI Follow-up for lead ${lead.name} (${lead.phone}) [Trigger: ${item.triggerType}]`);
        
        const messages = await chatService.getMessagesByLead(lead.id);
        const history = messages.slice(-6).map(m => ({
          role: m.sender === MessageSender.LEAD ? ('user' as const) : ('assistant' as const),
          content: m.content
        }));

        const followupText = await aiService.generateContextualFollowup(lead, item.triggerType, history);

        // Send message via Chat & WhatsApp Cloud API
        await chatService.sendMessage(
          lead.id,
          followupText,
          MessageSender.AI,
          MessageChannel.WHATSAPP,
          'text'
        );

        // Mark queue status as EXECUTADO
        await crmService.updateFollowupStatus(item.id, FollowupQueueStatus.EXECUTADO, 'Disparado com sucesso via WhatsApp');
        executed++;

        // Broadcast notification
        WebSocketGateway.getInstance().broadcast(WSEventType.AI_FOLLOWUP_TRIGGERED, {
          item: { ...item, status: FollowupQueueStatus.EXECUTADO },
          leadName: lead.name,
          phone: lead.phone,
          message: followupText,
          timestamp: new Date().toISOString()
        });
      }

      return {
        processed: pendingItems.length,
        executed,
        rescheduled,
        cancelled,
        skipped
      };
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Sweeper: Automatically schedules follow-up for leads stuck in PROPOSTA stage for >24h
   */
  async checkStagnantProposals(): Promise<number> {
    const stagnantLeads = await crmService.getStagnantProposalLeads(24);
    let enqueuedCount = 0;

    for (const lead of stagnantLeads) {
      console.log(`[Followup Worker] Stagnant proposal detected for lead "${lead.name}" (${lead.id}). Enqueuing automated follow-up.`);
      await crmService.enqueueFollowup(
        lead.id,
        FollowupTriggerType.STAGNANT_PROPOSAL,
        15 // Check in 15 minutes or on next run
      );
      enqueuedCount++;
    }

    return enqueuedCount;
  }
}

export const followupWorker = new FollowupWorker();
