import { AIAgent, FollowupTriggerType, KnowledgeBaseItem, Lead, MessageSender, WSEventType } from '@omnicrm/shared';
import { AutonomousAIAgent, EmbeddingService, PromptTemplates, ToolRegistry, VectorStoreService, whisperService } from '@omnicrm/ai-engine';
import { initialSeedData } from '@omnicrm/database/dist/seed.js';
import { WebSocketGateway } from '../../websocket/ws.gateway.js';
import { crmService } from '../crm/crm.service.js';
import { config } from '../../config.js';

class AIRepository {
  private toolRegistry: ToolRegistry;
  private embeddingService: EmbeddingService;
  private vectorStore: VectorStoreService;
  private agentRunner: AutonomousAIAgent;

  private knowledgeBase: KnowledgeBaseItem[] = [...(initialSeedData.knowledgeBase as any[])];

  private agentConfig: AIAgent = {
    id: '77777777-1111-0000-0000-000000000001',
    orgId: '11111111-1111-1111-1111-111111111111',
    name: 'Sofia - SDR & Atendente IA CRDISK',
    model: 'gpt-4o-mini',
    systemPrompt: `Você é a Sofia, consultora sênior de inteligência comercial e atendimento receptivo do CRDISK (CRM, Chat Live & Smart Dialer).
Seu objetivo é atender os leads que chegam pelo WhatsApp de forma cordial, ágil, objetiva e persuasiva.
Você tem acesso a 4 ferramentas oficiais que DEVE invocar quando apropriado:
1. buscar_base_conhecimento(query): use sempre para consultar regras de negócio, planos, preços e funcionalidades oficiais da empresa.
2. atualizar_estagio_lead(lead_id, novo_estagio): use quando o lead demonstrar interesse ou evolução para avançar no Kanban (ex: QUALIFICACAO, APRESENTACAO, PROPOSTA).
3. transferir_para_humano(lead_id, motivo): use quando o cliente pedir explicitamente para falar com uma pessoa/atendente ou para negociações sensíveis.
4. agendar_contato(lead_id, data_hora): use quando o cliente combinar uma data e horário para demonstração ou retorno comercial.

Nunca invente planos ou funcionalidades que não constem na base de conhecimento. Seja sempre prestativa e amigável.`,
    temperature: 0.7,
    knowledgeBaseId: 'kb-1',
    autoReplyWhatsApp: true,
    createdAt: new Date()
  };

  constructor() {
    this.toolRegistry = new ToolRegistry();
    this.embeddingService = new EmbeddingService(config.openai.apiKey, config.openai.embeddingModel);
    this.vectorStore = new VectorStoreService(this.embeddingService);
    this.agentRunner = new AutonomousAIAgent(this.toolRegistry, config.openai.apiKey);
  }

  getAgent(): AIAgent {
    return this.agentConfig;
  }

  updateAgent(data: Partial<AIAgent>): AIAgent {
    this.agentConfig = { ...this.agentConfig, ...data };
    return this.agentConfig;
  }

  listKnowledgeBase(): KnowledgeBaseItem[] {
    return this.knowledgeBase;
  }

  /**
   * Ingest text or PDF documents into the Knowledge Base with dense vector embeddings (text-embedding-3-small)
   */
  async addKnowledgeBaseItem(title: string, content: string, category = 'GERAL'): Promise<KnowledgeBaseItem> {
    const embedding = await this.embeddingService.generateEmbedding(content);
    const item: KnowledgeBaseItem = {
      id: `kb-${Date.now()}`,
      title,
      content,
      category,
      embedding,
      createdAt: new Date()
    };
    this.knowledgeBase.unshift(item);
    console.log(`[RAG Ingestion] Document "${title}" indexed with ${embedding.length}-dim vector embedding.`);
    return item;
  }

  /**
   * Cosine similarity semantic search over knowledge base
   */
  async searchKnowledgeBase(query: string, category?: string, limit = 4, threshold = 0.25) {
    let items = this.knowledgeBase;
    if (category && category !== 'ALL') {
      items = items.filter(i => i.category === category);
    }
    return await this.vectorStore.searchSimilarChunks(query, items, limit, threshold);
  }

  /**
   * Transcribe audio note via Whisper
   */
  async transcribeAudio(audioInput?: Buffer | string | null): Promise<string> {
    return await whisperService.transcribeAudio(audioInput);
  }

  /**
   * Receptive WhatsApp AI Agent Loop with 8-message history and Function Calling
   */
  async processChatWithAgent(
    userMessage: string,
    history: Array<{ role: 'user' | 'assistant'; content: string }>,
    leadContext?: { id?: string; name?: string; company?: string; phone?: string }
  ) {
    WebSocketGateway.getInstance().broadcast(WSEventType.AI_AGENT_THINKING, { query: userMessage });

    // Retrieve last 8 messages for context
    const recentHistory = history.slice(-8);

    // Dynamic Context callbacks for Tool Calling
    const toolContext = {
      leadContext,
      knowledgeSearchFn: async (query: string) => {
        const results = await this.searchKnowledgeBase(query);
        return results.map(r => ({
          title: r.item.title,
          content: r.item.content,
          similarity: Number(r.score.toFixed(3))
        }));
      },
      updateStageFn: async (leadId: string, stage: string) => {
        const targetId = leadId || leadContext?.id;
        if (targetId) {
          await crmService.updateFunnelStage(targetId, stage as any);
        }
        return { success: true, leadId: targetId, stage };
      },
      transferToHumanFn: async (leadId: string, reason: string) => {
        const targetId = leadId || leadContext?.id;
        if (targetId) {
          const { chatService } = await import('../chat/chat.service.js');
          await chatService.toggleHumanMode(targetId, true);
        }
        return { success: true, leadId: targetId, reason };
      },
      scheduleContactFn: async (leadId: string, dateTime: string, subject?: string) => {
        const targetId = leadId || leadContext?.id;
        if (targetId) {
          await crmService.enqueueFollowup(targetId, 'STAGE_CHANGED' as any, 60);
        }
        return { success: true, leadId: targetId, dateTime, subject };
      }
    };

    // Pre-retrieve top relevant chunks for RAG
    const relevantDocs = await this.searchKnowledgeBase(userMessage);
    const chunkTexts = relevantDocs.map(r => `[${r.item.title} (Similaridade: ${(r.score * 100).toFixed(1)}%)]: ${r.item.content}`);

    const result = await this.agentRunner.run({
      model: this.agentConfig.model,
      systemPrompt: this.agentConfig.systemPrompt,
      userMessage,
      conversationHistory: recentHistory,
      contextChunks: chunkTexts,
      leadContext,
      temperature: this.agentConfig.temperature
    });

    if (result.toolsExecuted.length > 0) {
      WebSocketGateway.getInstance().broadcast(WSEventType.AI_TOOL_EXECUTED, result.toolsExecuted);
    }

    return result;
  }

  /**
   * Generates a short, natural, contextual WhatsApp follow-up message using AI Sofia
   */
  async generateContextualFollowup(
    lead: Lead,
    triggerType: FollowupTriggerType,
    history: Array<{ role: 'user' | 'assistant'; content: string }> = []
  ): Promise<string> {
    const firstName = lead.name ? lead.name.split(' ')[0] : 'tudo bem';

    let reasonText = '';
    let callNotes = '';
    let defaultFallback = '';

    switch (triggerType) {
      case FollowupTriggerType.DISPOSITION_NAO_ATENDEU:
      case FollowupTriggerType.DISPOSITION_OCUPADO:
        reasonText = 'Tentativa de contato telefônico sem sucesso (não atendeu / ocupado)';
        callNotes = lead.lastCallStatus === 'ocupado' ? 'Número deu sinal de ocupado' : 'Chamou até a caixa postal / não atendeu';
        defaultFallback = `Olá, ${firstName}! Tudo bem? Tentei te ligar agora há pouco sobre o CRDISK, mas não consegui contato. Qual o melhor horário para conversarmos por aqui ou por ligação? 😊`;
        break;

      case FollowupTriggerType.STAGNANT_PROPOSAL:
        reasonText = 'Lead com proposta comercial enviada há mais de 24 horas sem retorno';
        callNotes = 'Proposta comercial apresentada anteriormente';
        defaultFallback = `Oi, ${firstName}! Tudo bem? Passando para saber se você conseguiu avaliar a proposta do CRDISK que enviamos. Ficou com alguma dúvida sobre os módulos de telefonia ou IA? 🚀`;
        break;

      case FollowupTriggerType.DISPOSITION_INTERESSADO:
        reasonText = 'Follow-up de demonstração ou reunião agendada';
        callNotes = 'Lead demonstrou interesse durante contato';
        defaultFallback = `Olá, ${firstName}! Foi ótimo conversar com você. Estou à disposição para tirar qualquer dúvida sobre a demonstração do sistema. Como posso te ajudar hoje?`;
        break;

      default:
        reasonText = 'Acompanhamento comercial proativo';
        callNotes = 'Contato periódico de relacionamento';
        defaultFallback = `Olá, ${firstName}! Como estão os projetos por aí? Gostaria de saber se tem interesse em conhecer as novidades do CRDISK para seu time de vendas!`;
        break;
    }

    // If autonomous AI agent is configured with OpenAI, generate dynamic personalized copy
    try {
      const followupPrompt = PromptTemplates.buildFollowupPrompt(lead.name, callNotes, reasonText);
      
      const result = await this.agentRunner.run({
        model: this.agentConfig.model,
        systemPrompt: `${this.agentConfig.systemPrompt}\n\n${followupPrompt}`,
        userMessage: `Gere apenas a mensagem de WhatsApp para enviar a ${firstName}. Não adicione aspas, nem introduções. Seja direto, caloroso e humano.`,
        conversationHistory: history.slice(-4),
        temperature: 0.7,
        leadContext: {
          name: lead.name,
          company: lead.company || undefined,
          phone: lead.phone
        }
      });

      if (result.reply && result.reply.trim().length > 10) {
        return result.reply.trim();
      }
    } catch (err) {
      console.warn('[AI Followup Generator] Fallback to pre-built contextual copy:', err);
    }

    return defaultFallback;
  }
}

export const aiService = new AIRepository();
