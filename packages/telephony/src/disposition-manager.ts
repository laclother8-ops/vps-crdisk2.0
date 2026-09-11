import { CallOutcomeStatus, FollowupTriggerType } from '@omnicrm/shared';

export interface DispositionActionResult {
  suggestedFollowupTrigger?: FollowupTriggerType;
  scheduleDelayMinutes?: number;
  aiPromptContext?: string;
}

export class DispositionManager {
  /**
   * Maps call outcomes to automated follow-up triggers and AI instructions
   */
  static processOutcome(status: CallOutcomeStatus, notes?: string | null): DispositionActionResult {
    switch (status) {
      case CallOutcomeStatus.NAO_ATENDEU:
      case CallOutcomeStatus.OCUPADO:
      case CallOutcomeStatus.CAIXA_POSTAL:
        return {
          suggestedFollowupTrigger: FollowupTriggerType.DISPOSITION_NAO_ATENDEU,
          scheduleDelayMinutes: 10,
          aiPromptContext: 'O lead não atendeu a ligação recente. Envie uma mensagem no WhatsApp simpática avisando que tentamos o contato telefônico e estamos à disposição para conversar por mensagem.'
        };

      case CallOutcomeStatus.REUNIAO_AGENDADA:
        return {
          suggestedFollowupTrigger: FollowupTriggerType.DISPOSITION_INTERESSADO,
          scheduleDelayMinutes: 2,
          aiPromptContext: 'Reunião agendada com sucesso via ligação! Envie a confirmação da data/hora e o link do convite de calendário no WhatsApp.'
        };

      case CallOutcomeStatus.SEM_INTERESSE:
        return {
          suggestedFollowupTrigger: undefined,
          scheduleDelayMinutes: 0,
          aiPromptContext: 'Lead informou não ter interesse no momento. Registre no CRM e pause novos contatos ativos.'
        };

      case CallOutcomeStatus.ATENDIDA:
        return {
          suggestedFollowupTrigger: FollowupTriggerType.DISPOSITION_INTERESSADO,
          scheduleDelayMinutes: 5,
          aiPromptContext: 'A ligação foi atendida. Envie um resumo com o material complementar e pergunte se prefere agendar uma call de demonstração.'
        };

      case CallOutcomeStatus.FALHA:
        return {
          suggestedFollowupTrigger: FollowupTriggerType.DISPOSITION_NAO_ATENDEU,
          scheduleDelayMinutes: 30,
          aiPromptContext: 'Houve uma falha técnica ao discar para o número. Envie uma mensagem rápida no WhatsApp verificando se este ainda é o canal de contato preferencial.'
        };

      default:
        return {};
    }
  }
}
