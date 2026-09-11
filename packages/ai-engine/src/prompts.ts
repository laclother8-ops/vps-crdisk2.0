export class PromptTemplates {
  static buildRAGSystemPrompt(
    basePrompt: string,
    contextChunks: string[],
    leadContext?: { name?: string; company?: string; phone?: string }
  ): string {
    let prompt = basePrompt;

    if (leadContext) {
      prompt += `\n\n### INFORMAÇÕES DO CLIENTE/LEAD ATUAL:
- Nome: ${leadContext.name || 'Desconhecido'}
- Empresa: ${leadContext.company || 'Não informada'}
- Telefone: ${leadContext.phone || 'N/A'}`;
    }

    if (contextChunks.length > 0) {
      prompt += `\n\n### BASE DE CONHECIMENTO OFICIAL (RAG):
Utilize as informações abaixo para embasar suas respostas com precisão:
${contextChunks.map((chunk, idx) => `[DOCUMENTO ${idx + 1}]:\n${chunk}`).join('\n\n')}

Regras RAG:
1. Responda baseando-se estritamente nas informações acima quando perguntado sobre planos, regras, preços ou produtos.
2. Se a informação não constar nos documentos, explique cordialmente que confirmará com o time de especialistas.`;
    }

    return prompt;
  }

  static buildFollowupPrompt(leadName: string, callNotes?: string, reason?: string): string {
    return `Você é um assistente comercial enviando uma mensagem rápida e acolhedora no WhatsApp para ${leadName}.
Contexto recente:
- Motivo do contato: ${reason || 'Follow-up de atendimento'}
- Observações da ligação anterior: ${callNotes || 'Sem resposta na chamada'}

Objetivo:
- Cumprimentar pelo nome.
- Mencionar brevemente que tentamos ligar ou que estamos dando continuidade.
- Fazer uma pergunta clara para engajar o lead a responder no chat.
- Mantenha tom profissional, caloroso e conciso (máximo 3 frases curtas).`;
  }
}
