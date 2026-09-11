import OpenAI from 'openai';
import { ToolRegistry } from './tool-caller.js';
import { PromptTemplates } from './prompts.js';

export interface AgentExecutionOptions {
  model?: string;
  systemPrompt: string;
  userMessage: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  contextChunks?: string[];
  leadContext?: { name?: string; company?: string; phone?: string };
  temperature?: number;
}

export interface AgentExecutionResult {
  reply: string;
  toolsExecuted: Array<{ tool: string; args: any; result: any }>;
  tokensUsed?: number;
}

export class AutonomousAIAgent {
  private openai: OpenAI | null = null;
  private toolRegistry: ToolRegistry;

  constructor(toolRegistry: ToolRegistry, apiKey?: string) {
    this.toolRegistry = toolRegistry;
    if (apiKey || process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: apiKey || process.env.OPENAI_API_KEY
      });
    }
  }

  /**
   * Runs the autonomous reasoning loop with Tool Calling & RAG context
   */
  async run(options: AgentExecutionOptions): Promise<AgentExecutionResult> {
    const {
      model = 'gpt-4o',
      systemPrompt,
      userMessage,
      conversationHistory = [],
      contextChunks = [],
      leadContext,
      temperature = 0.7
    } = options;

    const fullSystemPrompt = PromptTemplates.buildRAGSystemPrompt(systemPrompt, contextChunks, leadContext);

    // If no OpenAI API key is supplied, generate intelligent mock response with tool demo
    if (!this.openai) {
      return this.runMockLoop(userMessage, leadContext);
    }

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: fullSystemPrompt },
      ...conversationHistory.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: userMessage }
    ];

    const tools = this.toolRegistry.getOpenAIToolsFormat();
    const executedTools: Array<{ tool: string; args: any; result: any }> = [];

    // Max 3 iterations for ReAct tool-calling loop
    for (let iteration = 0; iteration < 3; iteration++) {
      const response = await this.openai.chat.completions.create({
        model,
        messages,
        temperature,
        tools: tools.length > 0 ? tools : undefined,
        tool_choice: tools.length > 0 ? 'auto' : undefined
      });

      const choice = response.choices[0];
      const message = choice.message;

      // Check if model wants to invoke a tool
      if (message.tool_calls && message.tool_calls.length > 0) {
        messages.push(message);

        for (const toolCall of message.tool_calls) {
          if (toolCall.type === 'function') {
            const toolName = toolCall.function.name;
            const toolArgs = JSON.parse(toolCall.function.arguments || '{}');
            
            try {
              const toolResult = await this.toolRegistry.executeTool(toolName, toolArgs, { leadContext });
              executedTools.push({ tool: toolName, args: toolArgs, result: toolResult });

              messages.push({
                role: 'tool',
                tool_call_id: toolCall.id,
                content: JSON.stringify(toolResult)
              });
            } catch (err: any) {
              messages.push({
                role: 'tool',
                tool_call_id: toolCall.id,
                content: JSON.stringify({ error: err.message })
              });
            }
          }
        }
      } else {
        // Final text response reached
        return {
          reply: message.content || 'Olá! Como posso ajudar você hoje?',
          toolsExecuted: executedTools,
          tokensUsed: response.usage?.total_tokens
        };
      }
    }

    return {
      reply: 'Ação executada com sucesso!',
      toolsExecuted: executedTools
    };
  }

  private async runMockLoop(userMessage: string, leadContext?: any): Promise<AgentExecutionResult> {
    const lower = userMessage.toLowerCase();
    const toolsExecuted: any[] = [];
    let reply = `Olá${leadContext?.name ? ` ${leadContext.name}` : ''}! `;

    if (lower.includes('agendar') || lower.includes('reunião') || lower.includes('demo') || lower.includes('call') || lower.includes('quinta')) {
      const toolRes = await this.toolRegistry.executeTool('agendar_contato', {
        lead_id: leadContext?.id || 'lead-current',
        data_hora: '2026-09-17 15:00',
        assunto: 'Demonstração Comercial do CRDISK'
      });
      toolsExecuted.push({ 
        tool: 'agendar_contato', 
        args: { lead_id: leadContext?.id, data_hora: '2026-09-17 15:00' }, 
        result: toolRes 
      });
      reply += `Reservei um horário para nossa reunião nesta quinta-feira às 15:00! Registrei o agendamento no sistema e você receberá uma notificação de confirmação.`;
    } else if (lower.includes('humano') || lower.includes('atendente') || lower.includes('pessoa') || lower.includes('urgente')) {
      const toolRes = await this.toolRegistry.executeTool('transferir_para_humano', {
        lead_id: leadContext?.id || 'lead-current',
        motivo: 'Solicitação direta de atendimento humano pelo lead'
      });
      toolsExecuted.push({ 
        tool: 'transferir_para_humano', 
        args: { lead_id: leadContext?.id, motivo: 'Solicitação direta do lead' }, 
        result: toolRes 
      });
      reply += `Transferi seu atendimento para um de nossos atendentes humanos no Chat Live. Um especialista assumirá a conversa em instantes!`;
    } else if (lower.includes('fechar') || lower.includes('proposta') || lower.includes('avançar') || lower.includes('interesse')) {
      const toolRes = await this.toolRegistry.executeTool('atualizar_estagio_lead', {
        lead_id: leadContext?.id || 'lead-current',
        novo_estagio: 'QUALIFICACAO'
      });
      toolsExecuted.push({ 
        tool: 'atualizar_estagio_lead', 
        args: { lead_id: leadContext?.id, novo_estagio: 'QUALIFICACAO' }, 
        result: toolRes 
      });
      reply += `Perfeito! Atualizei sua oportunidade em nosso pipeline. Vamos preparar os detalhes da proposta para você.`;
    } else {
      const toolRes = await this.toolRegistry.executeTool('buscar_base_conhecimento', {
        query: userMessage
      });
      toolsExecuted.push({ 
        tool: 'buscar_base_conhecimento', 
        args: { query: userMessage }, 
        result: toolRes 
      });
      reply += `Consultei nossa base de conhecimento oficial: O CRDISK oferece planos a partir de R$ 490/mês com CRM Kanban, Discador WebRTC ilimitado e agente de IA integrado. Como posso te ajudar a avançar?`;
    }

    return { reply, toolsExecuted };
  }
}
