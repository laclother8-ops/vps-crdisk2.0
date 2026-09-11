import { CallOutcomeStatus, FollowupQueueItem, FollowupQueueStatus, FollowupTriggerType, FunnelStage, Lead, LeadContactStatus, LeadFilterParams, PaginatedLeadsResponse, WSEventType } from '@omnicrm/shared';
import { initialSeedData } from '@omnicrm/database/dist/seed.js';
import { WebSocketGateway } from '../../websocket/ws.gateway.js';

class CRMRepository {
  private leads: Lead[] = [...((initialSeedData?.leads || []) as any[])];
  private followupQueue: FollowupQueueItem[] = [...((initialSeedData?.followUpJobs || (initialSeedData as any)?.followupQueue || []) as any[])];

  // 1. Paginated & Filtered Leads
  async listLeads(params: LeadFilterParams = {}): Promise<PaginatedLeadsResponse> {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      funnelStage,
      tag,
      assignedUserId,
      workspaceId
    } = params as any;

    let filtered = [...this.leads];

    if (workspaceId) {
      filtered = filtered.filter(l => (l as any).workspaceId === workspaceId || (l as any).orgId === workspaceId);
    }

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(l => 
        l.name.toLowerCase().includes(q) ||
        l.phone.includes(q) ||
        (l.email && l.email.toLowerCase().includes(q)) ||
        (l.company && l.company.toLowerCase().includes(q))
      );
    }

    if (status) {
      filtered = filtered.filter(l => l.status === status);
    }

    if (funnelStage) {
      filtered = filtered.filter(l => l.funnelStage === funnelStage);
    }

    if (tag) {
      filtered = filtered.filter(l => l.tags && l.tags.includes(tag));
    }

    if (assignedUserId) {
      filtered = filtered.filter(l => l.assignedUserId === assignedUserId);
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    return {
      data: paginated,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages
      }
    };
  }

  // 2. Get Single Lead
  async getLeadById(id: string): Promise<Lead | undefined> {
    return this.leads.find(l => l.id === id);
  }

  // 3. Create Lead
  async createLead(data: Partial<Lead>): Promise<Lead> {
    const lead: Lead = {
      id: `lead-${Date.now()}`,
      orgId: data.orgId || '11111111-1111-1111-1111-111111111111',
      name: data.name || 'Novo Lead',
      phone: data.phone || '',
      email: data.email || null,
      company: data.company || null,
      status: data.status || LeadContactStatus.NAO_CONTATADO,
      funnelStage: data.funnelStage || FunnelStage.NOVO_LEAD,
      lastCallStatus: null,
      optOut: data.optOut || false,
      tags: data.tags || ['Novo'],
      score: data.score || 10,
      dealValue: data.dealValue || 0,
      assignedUserId: data.assignedUserId || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.leads.unshift(lead);
    WebSocketGateway.getInstance().broadcast(WSEventType.CRM_LEAD_CREATED, lead);
    return lead;
  }

  // 4. Update Lead
  async updateLead(id: string, data: Partial<Lead>): Promise<Lead | null> {
    const lead = this.leads.find(l => l.id === id);
    if (!lead) return null;

    Object.assign(lead, {
      ...data,
      updatedAt: new Date()
    });

    WebSocketGateway.getInstance().broadcast(WSEventType.CRM_LEAD_UPDATED, lead);
    return lead;
  }

  // 5. Delete Lead
  async deleteLead(id: string): Promise<boolean> {
    const index = this.leads.findIndex(l => l.id === id);
    if (index === -1) return false;
    this.leads.splice(index, 1);
    return true;
  }

  // 6. Update Funnel Stage
  async updateFunnelStage(leadId: string, funnelStage: FunnelStage): Promise<Lead | null> {
    const lead = this.leads.find(l => l.id === leadId);
    if (!lead) return null;

    lead.funnelStage = funnelStage;
    lead.updatedAt = new Date();

    if (funnelStage === FunnelStage.FECHADO_GANHO) {
      lead.status = LeadContactStatus.CLIENTE;
    }

    WebSocketGateway.getInstance().broadcast(WSEventType.CRM_DEAL_STAGE_CHANGED, lead);
    return lead;
  }

  // 7. Update Contact Status & Opt Out
  async updateContactStatus(
    leadId: string, 
    status: LeadContactStatus, 
    optOut?: boolean, 
    lastCallStatus?: CallOutcomeStatus | null
  ): Promise<Lead | null> {
    const lead = this.leads.find(l => l.id === leadId);
    if (!lead) return null;

    lead.status = status;
    if (optOut !== undefined) lead.optOut = optOut;
    if (lastCallStatus !== undefined) lead.lastCallStatus = lastCallStatus;
    lead.updatedAt = new Date();

    WebSocketGateway.getInstance().broadcast(WSEventType.CRM_LEAD_UPDATED, lead);
    return lead;
  }

  // 8. Followup Queue Management
  async listFollowupQueue(): Promise<FollowupQueueItem[]> {
    return this.followupQueue.map(item => ({
      ...item,
      lead: this.leads.find(l => l.id === item.leadId) || null
    }));
  }

  async getPendingFollowups(): Promise<FollowupQueueItem[]> {
    const now = Date.now();
    return this.followupQueue
      .filter(item => item.status === FollowupQueueStatus.PENDENTE && new Date(item.scheduledFor).getTime() <= now)
      .map(item => ({
        ...item,
        lead: this.leads.find(l => l.id === item.leadId) || null
      }));
  }

  async enqueueFollowup(
    leadId: string, 
    triggerType: FollowupTriggerType, 
    delayMinutes = 15,
    customScheduledFor?: Date
  ): Promise<FollowupQueueItem> {
    const scheduledFor = customScheduledFor || new Date(Date.now() + 1000 * 60 * delayMinutes);
    const item: FollowupQueueItem = {
      id: `fol-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      leadId,
      triggerType,
      scheduledFor,
      status: FollowupQueueStatus.PENDENTE,
      step: 1,
      createdAt: new Date()
    };
    this.followupQueue.unshift(item);
    WebSocketGateway.getInstance().broadcast(WSEventType.AI_FOLLOWUP_TRIGGERED, {
      ...item,
      lead: this.leads.find(l => l.id === leadId) || null
    });
    return item;
  }

  async updateFollowupStatus(
    id: string, 
    status: FollowupQueueStatus, 
    errorReason?: string
  ): Promise<FollowupQueueItem | null> {
    const item = this.followupQueue.find(f => f.id === id);
    if (!item) return null;

    item.status = status;
    if (errorReason) {
      (item as any).notes = errorReason;
    }

    const populated = {
      ...item,
      lead: this.leads.find(l => l.id === item.leadId) || null
    };

    WebSocketGateway.getInstance().broadcast(WSEventType.AI_FOLLOWUP_TRIGGERED, populated);
    return populated;
  }

  async rescheduleFollowup(id: string, newScheduledFor: Date): Promise<FollowupQueueItem | null> {
    const item = this.followupQueue.find(f => f.id === id);
    if (!item) return null;

    item.scheduledFor = newScheduledFor;
    item.status = FollowupQueueStatus.PENDENTE;

    const populated = {
      ...item,
      lead: this.leads.find(l => l.id === item.leadId) || null
    };

    WebSocketGateway.getInstance().broadcast(WSEventType.AI_FOLLOWUP_TRIGGERED, populated);
    return populated;
  }

  async cancelFollowupsForLead(leadId: string, reason = 'Lead interagiu no WhatsApp'): Promise<number> {
    let cancelledCount = 0;
    this.followupQueue.forEach(item => {
      if (item.leadId === leadId && item.status === FollowupQueueStatus.PENDENTE) {
        item.status = FollowupQueueStatus.CANCELADO;
        (item as any).notes = reason;
        cancelledCount++;
      }
    });

    if (cancelledCount > 0) {
      console.log(`[CRM Followup] Cancelled ${cancelledCount} pending followups for lead ${leadId} (${reason}).`);
    }

    return cancelledCount;
  }

  async getStagnantProposalLeads(stagnantHours = 24): Promise<Lead[]> {
    const cutoffTime = Date.now() - stagnantHours * 60 * 60 * 1000;
    return this.leads.filter(lead => {
      if (lead.funnelStage !== FunnelStage.PROPOSTA) return false;
      if (lead.optOut) return false;

      // Check if lead was updated or created before cutoff
      const lastActionTime = new Date(lead.updatedAt || lead.createdAt).getTime();
      const isStagnant = lastActionTime <= cutoffTime;
      if (!isStagnant) return false;

      // Ensure no active pending followup already scheduled for proposal
      const hasPending = this.followupQueue.some(
        f => f.leadId === lead.id && 
        f.status === FollowupQueueStatus.PENDENTE && 
        f.triggerType === FollowupTriggerType.STAGNANT_PROPOSAL
      );

      return !hasPending;
    });
  }

  private notes: Array<{
    id: string;
    leadId: string;
    authorName: string;
    content: string;
    createdAt: Date;
  }> = [
    {
      id: 'note-matriz-01',
      leadId: 'lead-matriz-002',
      authorName: 'Master Admin (CRDISK)',
      content: 'Mariana solicitou detalhamento sobre a infraestrutura de gravação de chamadas e conformidade LGPD. Proposta técnica em elaboração.',
      createdAt: new Date(Date.now() - 3600000 * 6)
    },
    {
      id: 'note-matriz-02',
      leadId: 'lead-matriz-003',
      authorName: 'Master Admin (CRDISK)',
      content: 'Hospital MedCenter aprovou o escopo da implantação do discador automático para confirmação de consultas. Aguardando validação jurídica.',
      createdAt: new Date(Date.now() - 3600000 * 18)
    },
    {
      id: 'note-matriz-03',
      leadId: 'lead-matriz-004',
      authorName: 'Master Admin (CRDISK)',
      content: 'Follow-up realizado via WhatsApp. Roberto solicitou reagendamento da demo para quinta-feira às 15h.',
      createdAt: new Date(Date.now() - 3600000 * 8)
    },
    {
      id: 'note-01',
      leadId: 'lead-alpha-001',
      authorName: 'Carlos Gestor',
      content: 'Cliente demonstrou alto interesse no plano Enterprise com 10 ramais WebRTC. Agendada demo para amanhã às 14h.',
      createdAt: new Date(Date.now() - 3600000 * 5)
    },
    {
      id: 'note-02',
      leadId: 'lead-alpha-002',
      authorName: 'Amanda Atendente',
      content: 'Ligação realizada via softphone. Decisor confirmou interesse e solicitou minuta contratual.',
      createdAt: new Date(Date.now() - 3600000 * 10)
    }
  ];

  async addLeadNote(leadId: string, content: string, authorName = 'Atendente'): Promise<any> {
    const note = {
      id: `note-${Date.now()}`,
      leadId,
      authorName,
      content,
      createdAt: new Date()
    };
    this.notes.unshift(note);
    return note;
  }

  async getLeadTimeline(leadId: string): Promise<any[]> {
    const lead = await this.getLeadById(leadId);
    if (!lead) return [];

    const timeline: any[] = [];

    // 1. Internal Notes
    const leadNotes = this.notes.filter(n => n.leadId === leadId);
    leadNotes.forEach(n => {
      timeline.push({
        id: n.id,
        type: 'note',
        timestamp: n.createdAt,
        title: `Nota interna por ${n.authorName}`,
        content: n.content,
        author: n.authorName
      });
    });

    // 2. Chat Messages
    try {
      const { chatService } = await import('../chat/chat.service.js');
      const messages = await chatService.getMessagesByLead(leadId);
      messages.forEach(m => {
        timeline.push({
          id: m.id,
          type: 'message',
          timestamp: m.createdAt,
          title: m.sender === 'lead' ? `Mensagem de ${lead.name}` : m.sender === 'ai' ? 'Resposta Automática IA Sofia' : 'Mensagem do Atendente',
          content: m.content,
          sender: m.sender,
          channel: m.channel,
          mediaUrl: m.mediaUrl
        });
      });
    } catch (e) {
      // Ignore if chatService fails
    }

    // 3. Telephony Calls
    try {
      const { telephonyService } = await import('../telephony/telephony.service.js');
      const allCalls = await telephonyService.listCalls();
      const leadCalls = allCalls.filter(c => c.leadId === leadId);
      leadCalls.forEach(c => {
        timeline.push({
          id: c.id,
          type: 'call',
          timestamp: c.createdAt,
          title: `Chamada Telefônica (${c.status.toUpperCase()})`,
          duration: c.duration,
          status: c.status,
          recordingUrl: c.recordingUrl || 'https://storage.crdisk.com.br/recordings/sample-call-demo.mp3',
          notes: c.notes
        });
      });
    } catch (e) {
      // Ignore if telephonyService fails
    }

    // Sort chronologically descending (newest first)
    return timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
}

export const crmService = new CRMRepository();
