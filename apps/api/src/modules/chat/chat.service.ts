import { 
  CannedResponseTemplate,
  Conversation, 
  ConversationFilter,
  DeliveryStatus, 
  LeadContactStatus, 
  Message, 
  MessageChannel, 
  MessageSender, 
  MessageType, 
  WSEventType 
} from '@omnicrm/shared';
import { initialSeedData } from '@omnicrm/database/dist/seed.js';
import { WebSocketGateway } from '../../websocket/ws.gateway.js';
import { crmService } from '../crm/crm.service.js';
import { aiService } from '../ai/ai.service.js';
import { whatsappService, WhatsAppInboundMessage, WhatsAppStatusUpdate } from './whatsapp.service.js';

class ChatRepository {
  private messages: Message[] = [...(initialSeedData.messages as any[])];
  private humanHandledLeads: Set<string> = new Set<string>();
  private conversationAssignments: Map<string, { assignedTo?: string; assignedDepartment?: string; status: 'OPEN' | 'PENDING' | 'CLOSED' }> = new Map();

  private templates: CannedResponseTemplate[] = [
    {
      id: 'tpl-1',
      title: 'Saudação Padrão',
      shortcut: '#ola',
      category: 'saudacao',
      content: 'Olá! Seja muito bem-vindo à CRDISK. Meu nome é consultor comercial e estou à sua disposição. Como posso te ajudar hoje?'
    },
    {
      id: 'tpl-2',
      title: 'Apresentação da Plataforma',
      shortcut: '#apresentacao',
      category: 'qualificacao',
      content: 'A CRDISK integra CRM visual, Discador WebRTC de alta performance e Atendimento WhatsApp com Inteligência Artificial Sofia em um único sistema. Gostaria de agendar uma demonstração?'
    },
    {
      id: 'tpl-3',
      title: 'Envio de Proposta Comercial',
      shortcut: '#proposta',
      category: 'proposta',
      content: 'Acabamos de disponibilizar sua proposta comercial personalizada. Podemos alinhar os próximos passos para a ativação da sua operação?'
    },
    {
      id: 'tpl-4',
      title: 'Agendamento de Ligação',
      shortcut: '#agendar',
      category: 'fechamento',
      content: 'Qual o melhor horário para fazermos uma chamada rápida de 5 minutos pelo nosso discador para tirar suas dúvidas?'
    },
    {
      id: 'tpl-5',
      title: 'Follow-up de Reativação',
      shortcut: '#followup',
      category: 'qualificacao',
      content: 'Olá! Passando para saber se teve a oportunidade de avaliar nossa proposta. Temos condições especiais válidas para ativação ainda nesta semana!'
    }
  ];

  getTemplates(): CannedResponseTemplate[] {
    return this.templates;
  }

  async listConversations(filter: ConversationFilter = 'all', channelFilter?: string): Promise<Conversation[]> {
    const leadsRes = await crmService.listLeads({ limit: 50 });
    const leads = leadsRes.data;

    let convs: Conversation[] = leads.map(lead => {
      const leadMsgs = this.messages
        .filter(m => m.leadId === lead.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const lastMsg = leadMsgs[0] || null;
      const isHuman = this.humanHandledLeads.has(lead.id) || lead.status === ('em_atendimento_humano' as any);
      const assignment = this.conversationAssignments.get(lead.id) || { status: 'OPEN' };

      // Unread count: inbound messages from lead that are unread
      const unreadCount = leadMsgs.filter(m => m.sender === MessageSender.LEAD && m.status !== 'read').length;

      return {
        id: `conv-${lead.id}`,
        leadId: lead.id,
        lead,
        channel: lastMsg?.channel || MessageChannel.WHATSAPP,
        status: assignment.status,
        aiHandled: !isHuman,
        isHumanHandled: isHuman,
        assignedTo: assignment.assignedTo || (isHuman ? 'operador-atual' : null),
        assignedDepartment: assignment.assignedDepartment || (isHuman ? 'Comercial' : 'IA Sofia'),
        lastMessageAt: lastMsg ? new Date(lastMsg.createdAt) : new Date(lead.createdAt),
        lastMessage: lastMsg,
        unreadCount: unreadCount > 0 ? unreadCount : (lastMsg?.sender === MessageSender.LEAD ? 1 : 0),
        createdAt: new Date(lead.createdAt)
      };
    });

    // Apply Tab Filters
    if (filter === 'mine') {
      convs = convs.filter(c => c.isHumanHandled && c.status !== 'CLOSED');
    } else if (filter === 'unassigned') {
      convs = convs.filter(c => !c.assignedTo && !c.isHumanHandled && c.status !== 'CLOSED');
    } else if (filter === 'ai') {
      convs = convs.filter(c => c.aiHandled && !c.isHumanHandled && c.status !== 'CLOSED');
    } else if (filter === 'closed') {
      convs = convs.filter(c => c.status === 'CLOSED');
    }

    if (channelFilter && channelFilter !== 'all' && channelFilter !== 'ALL') {
      convs = convs.filter(c => c.channel.toLowerCase() === channelFilter.toLowerCase());
    }

    return convs.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
  }

  async getMessagesByLead(leadId: string): Promise<Message[]> {
    // Mark lead messages as read when fetched
    this.messages.forEach(m => {
      if (m.leadId === leadId && m.sender === MessageSender.LEAD) {
        m.status = 'read';
      }
    });
    return this.messages.filter(m => m.leadId === leadId);
  }

  async sendMessage(
    leadId: string, 
    content: string, 
    sender = MessageSender.HUMAN, 
    channel = MessageChannel.WHATSAPP,
    type: MessageType = 'text',
    mediaUrl?: string,
    duration?: number
  ): Promise<Message> {
    const msg: Message = {
      id: `msg-${Date.now()}`,
      leadId,
      sender,
      content,
      channel,
      type,
      mediaUrl,
      duration,
      status: 'sent',
      createdAt: new Date()
    };

    this.messages.push(msg);

    // If channel is WhatsApp and sent by operator or AI, trigger WhatsApp Cloud API dispatch
    if (channel === MessageChannel.WHATSAPP && sender !== MessageSender.LEAD) {
      const lead = await crmService.getLeadById(leadId);
      if (lead && lead.phone) {
        if (type === 'audio' && mediaUrl) {
          whatsappService.sendAudioMessage(lead.phone, mediaUrl).then(res => {
            if (res.success) {
              msg.status = 'delivered';
              WebSocketGateway.getInstance().broadcast(WSEventType.CHAT_MESSAGE_STATUS, {
                messageId: msg.id,
                status: 'delivered'
              });
            }
          });
        } else {
          whatsappService.sendTextMessage(lead.phone, content).then(res => {
            if (res.success) {
              msg.status = 'delivered';
              WebSocketGateway.getInstance().broadcast(WSEventType.CHAT_MESSAGE_STATUS, {
                messageId: msg.id,
                status: 'delivered'
              });
            }
          });
        }
      }
    }

    // Broadcast new message event via WebSocket
    WebSocketGateway.getInstance().broadcast(WSEventType.CHAT_MESSAGE_NEW, msg);
    return msg;
  }

  /**
   * Process incoming WhatsApp webhook message with Human Handled business rule
   */
  async handleInboundWhatsApp(inbound: WhatsAppInboundMessage): Promise<void> {
    const leadsRes = await crmService.listLeads({ search: inbound.fromPhone });
    let lead = leadsRes.data[0];

    if (!lead) {
      lead = await crmService.createLead({
        name: inbound.senderName || `WhatsApp ${inbound.fromPhone}`,
        phone: inbound.fromPhone,
        tags: ['Inbound WhatsApp']
      });
    }

    let effectiveText = inbound.text || '';

    // If incoming message is audio, transcribe with Whisper
    if (inbound.type === 'audio') {
      const transcription = await aiService.transcribeAudio(inbound.audioUrl);
      effectiveText = transcription;
      console.log(`[Whisper Audio Transcribed] Phone: ${inbound.fromPhone} -> Text: "${transcription}"`);
    }

    // Save lead inbound message
    const msg = await this.sendMessage(
      lead.id, 
      effectiveText || '[Mensagem Recebida]', 
      MessageSender.LEAD, 
      MessageChannel.WHATSAPP,
      inbound.type,
      inbound.audioUrl,
      inbound.audioDuration
    );

    // Cancel any pending automated follow-ups for this lead since they reached out
    await crmService.cancelFollowupsForLead(lead.id, 'Lead respondeu no WhatsApp');

    const isHuman = this.humanHandledLeads.has(lead.id) || lead.status === ('em_atendimento_humano' as any);

    // Business rule: If in human mode, notify operator and DO NOT invoke autonomous AI
    if (isHuman) {
      console.log(`[WhatsApp Inbound] Lead ${lead.name} (${lead.phone}) is in HUMAN SUPPORT. AI Sofia auto-reply suppressed.`);
      
      // Send real-time takeover alert to operator
      WebSocketGateway.getInstance().broadcast(WSEventType.AGENT_TAKEOVER_ALERT, {
        leadId: lead.id,
        leadName: lead.name,
        phone: lead.phone,
        message: effectiveText,
        timestamp: new Date().toISOString(),
        alert: `Novo contato de ${lead.name}. Atendimento Humano Ativo (IA Pausada).`
      });
      return;
    }

    // Autonomous AI Sofia response using the last 8 messages
    setTimeout(async () => {
      try {
        const history = this.messages
          .filter(m => m.leadId === lead.id)
          .slice(-8)
          .map(m => ({
            role: m.sender === MessageSender.LEAD ? ('user' as const) : ('assistant' as const),
            content: m.content
          }));

        const aiResponse = await aiService.processChatWithAgent(effectiveText || 'Olá', history, {
          id: lead.id,
          name: lead.name,
          company: lead.company || undefined,
          phone: lead.phone
        });

        await this.sendMessage(
          lead.id, 
          aiResponse.reply, 
          MessageSender.AI, 
          MessageChannel.WHATSAPP,
          'text'
        );
      } catch (err) {
        console.error('[AI Chat Error]', err);
      }
    }, 1200);
  }

  /**
   * Update message delivery status from Meta Webhook
   */
  async handleDeliveryStatus(statusUpdate: WhatsAppStatusUpdate): Promise<void> {
    const msg = this.messages.find(m => m.id === statusUpdate.messageId || m.id.includes(statusUpdate.messageId));
    if (msg) {
      msg.status = statusUpdate.status;
    }

    WebSocketGateway.getInstance().broadcast(WSEventType.CHAT_MESSAGE_STATUS, {
      messageId: statusUpdate.messageId,
      status: statusUpdate.status,
      timestamp: statusUpdate.timestamp
    });
  }

  /**
   * Toggle Human Support vs AI Sofia
   */
  async toggleHumanMode(leadId: string, isHuman: boolean): Promise<{ success: boolean; isHumanHandled: boolean }> {
    if (isHuman) {
      this.humanHandledLeads.add(leadId);
      await crmService.updateLead(leadId, { status: 'em_atendimento_humano' as any });
    } else {
      this.humanHandledLeads.delete(leadId);
      await crmService.updateLead(leadId, { status: LeadContactStatus.EM_ATENDIMENTO });
    }

    WebSocketGateway.getInstance().broadcast(WSEventType.CHAT_HUMAN_MODE_TOGGLED, {
      leadId,
      isHumanHandled: isHuman,
      timestamp: new Date().toISOString()
    });

    return { success: true, isHumanHandled: isHuman };
  }

  /**
   * Transfer conversation to another operator or department
   */
  async transferConversation(
    leadId: string, 
    targetUserId?: string, 
    targetDepartment?: string, 
    notes?: string
  ): Promise<{ success: boolean; leadId: string; assignedTo?: string; assignedDepartment?: string }> {
    const current = this.conversationAssignments.get(leadId) || { status: 'OPEN' };
    current.assignedTo = targetUserId || current.assignedTo;
    current.assignedDepartment = targetDepartment || current.assignedDepartment;
    this.conversationAssignments.set(leadId, current);

    // If transferred to AI, remove human handled flag
    if (targetDepartment?.toLowerCase().includes('ia') || targetUserId?.toLowerCase().includes('sofia')) {
      await this.toggleHumanMode(leadId, false);
    } else {
      await this.toggleHumanMode(leadId, true);
    }

    const lead = await crmService.getLeadById(leadId);
    const transferNote = `[Transferência de Atendimento] Encaminhado para ${targetDepartment || 'Operador'} ${targetUserId ? `(${targetUserId})` : ''}.${notes ? ` Nota: ${notes}` : ''}`;

    // Add transfer internal note to message history
    const sysMsg: Message = {
      id: `msg-transf-${Date.now()}`,
      leadId,
      sender: MessageSender.HUMAN,
      content: transferNote,
      channel: MessageChannel.WHATSAPP,
      type: 'text',
      status: 'read',
      createdAt: new Date()
    };
    this.messages.push(sysMsg);

    // Broadcast transfer event
    WebSocketGateway.getInstance().broadcast(WSEventType.CHAT_CONVERSATION_TRANSFERRED, {
      leadId,
      leadName: lead?.name || 'Cliente',
      assignedTo: targetUserId,
      assignedDepartment: targetDepartment,
      notes,
      timestamp: new Date().toISOString()
    });

    WebSocketGateway.getInstance().broadcast(WSEventType.CHAT_MESSAGE_NEW, sysMsg);

    return {
      success: true,
      leadId,
      assignedTo: targetUserId,
      assignedDepartment: targetDepartment
    };
  }

  /**
   * Handle typing indicator and trigger auto-handoff when human is typing
   */
  async notifyTyping(leadId: string, sender: 'human' | 'lead' = 'human'): Promise<{ success: boolean; isHumanHandled: boolean }> {
    if (sender === 'human' && !this.humanHandledLeads.has(leadId)) {
      await this.toggleHumanMode(leadId, true);
    }

    WebSocketGateway.getInstance().broadcast(WSEventType.CHAT_TYPING, {
      leadId,
      sender,
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      isHumanHandled: this.humanHandledLeads.has(leadId)
    };
  }

  isLeadInHumanMode(leadId: string): boolean {
    return this.humanHandledLeads.has(leadId);
  }

  getLastLeadMessageTime(leadId: string): Date | null {
    const leadMsgs = this.messages
      .filter(m => m.leadId === leadId && m.sender === MessageSender.LEAD)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return leadMsgs.length > 0 ? new Date(leadMsgs[0].createdAt) : null;
  }
}

export const chatService = new ChatRepository();
