export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  execute: (params: any, context?: any) => Promise<any>;
}

export class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();

  constructor() {
    this.registerDefaultTools();
  }

  registerTool(tool: ToolDefinition) {
    this.tools.set(tool.name, tool);
  }

  getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  getAllTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  getOpenAIToolsFormat(): any[] {
    return this.getAllTools().map(tool => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters
      }
    }));
  }

  async executeTool(name: string, args: any, context?: any): Promise<any> {
    const tool = this.getTool(name);
    if (!tool) {
      throw new Error(`Tool "${name}" não encontrada no registry.`);
    }
    return await tool.execute(args, context);
  }

  private registerDefaultTools() {
    // 1. Tool: buscar_base_conhecimento(query)
    this.registerTool({
      name: 'buscar_base_conhecimento',
      description: 'Pesquisa informações oficiais da empresa, regras de negócio, planos, integrações e documentação técnica usando busca semântica por similaridade vetorial.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Termo de busca ou dúvida específica a ser pesquisada' }
        },
        required: ['query']
      },
      execute: async (params, ctx) => {
        if (ctx?.knowledgeSearchFn) {
          return await ctx.knowledgeSearchFn(params.query);
        }
        return {
          results: [
            {
              title: 'Planos e Preços CRDISK',
              content: 'Plano Pro R$ 490/mês com CRM Kanban, Discador WebRTC e Sofia IA. Plano Enterprise sob consulta com instâncias dedicadas.',
              similarity: 0.94
            },
            {
              title: 'Integração WhatsApp Cloud API',
              content: 'Conexão nativa com a API oficial da Meta, permitindo envio de texto, áudio de voz, imagens e botões interativos.',
              similarity: 0.89
            }
          ]
        };
      }
    });

    // 2. Tool: atualizar_estagio_lead(lead_id, novo_estagio)
    this.registerTool({
      name: 'atualizar_estagio_lead',
      description: 'Move o lead para um novo estágio no funil de vendas do CRM (Kanban). Use quando o lead demonstrar avanço ou interesse.',
      parameters: {
        type: 'object',
        properties: {
          lead_id: { type: 'string', description: 'ID único do lead no CRM' },
          novo_estagio: { 
            type: 'string', 
            enum: ['PROSPECCAO', 'QUALIFICACAO', 'APRESENTACAO', 'NEGOCIACAO', 'FECHAMENTO', 'PERDIDO'],
            description: 'Novo estágio do funil de vendas para onde o lead será movimentado' 
          }
        },
        required: ['lead_id', 'novo_estagio']
      },
      execute: async (params, ctx) => {
        if (ctx?.updateStageFn) {
          return await ctx.updateStageFn(params.lead_id, params.novo_estagio);
        }
        return {
          success: true,
          leadId: params.lead_id,
          novoEstagio: params.novo_estagio,
          message: `Lead ${params.lead_id} movido com sucesso para o estágio ${params.novo_estagio}.`
        };
      }
    });

    // 3. Tool: transferir_para_humano(lead_id, motivo)
    this.registerTool({
      name: 'transferir_para_humano',
      description: 'Transfere o atendimento para um operador humano, pausando imediatamente a IA no lead e notificando a equipe no Chat Live.',
      parameters: {
        type: 'object',
        properties: {
          lead_id: { type: 'string', description: 'ID do lead a ser transferido' },
          motivo: { type: 'string', description: 'Motivo da transferência (Ex: solicitação direta do cliente, negociação complexa, dúvida não coberta)' }
        },
        required: ['lead_id', 'motivo']
      },
      execute: async (params, ctx) => {
        if (ctx?.transferToHumanFn) {
          return await ctx.transferToHumanFn(params.lead_id, params.motivo);
        }
        return {
          success: true,
          leadId: params.lead_id,
          humanMode: true,
          message: `Atendimento transferido para a fila humana. Motivo: ${params.motivo}`
        };
      }
    });

    // 4. Tool: agendar_contato(lead_id, data_hora)
    this.registerTool({
      name: 'agendar_contato',
      description: 'Registra um agendamento de contato, reunião de demonstração ou call de fechamento para o lead no CRM.',
      parameters: {
        type: 'object',
        properties: {
          lead_id: { type: 'string', description: 'ID do lead no CRM' },
          data_hora: { type: 'string', description: 'Data e horário do agendamento no formato ISO ou YYYY-MM-DD HH:mm (Ex: 2026-09-15 14:00)' },
          assunto: { type: 'string', description: 'Objetivo da reunião ou contato' }
        },
        required: ['lead_id', 'data_hora']
      },
      execute: async (params, ctx) => {
        if (ctx?.scheduleContactFn) {
          return await ctx.scheduleContactFn(params.lead_id, params.data_hora, params.assunto);
        }
        return {
          success: true,
          leadId: params.lead_id,
          scheduledFor: params.data_hora,
          message: `Contato agendado com sucesso para ${params.data_hora}. Convite gerado no CRM.`
        };
      }
    });
  }
}
