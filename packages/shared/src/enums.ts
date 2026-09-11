export enum UserRole {
  SUPERADMIN = 'superadmin',
  WORKSPACE_ADMIN = 'workspace_admin',
  OPERATOR = 'operator',
  // Aliases
  ADMIN = 'workspace_admin',
  AGENT = 'operator'
}

export enum WorkspaceStatus {
  ACTIVE = 'active',
  BLOCKED = 'blocked',
  TRIAL = 'trial'
}

export enum SubscriptionStatus {
  TRIAL = 'trial',
  ACTIVE = 'active',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
  PENDING_PAYMENT = 'pending_payment'
}

export enum SubscriptionPlan {
  STARTER = 'starter',
  PRO = 'pro',
  ENTERPRISE = 'enterprise'
}

export enum UserStatus {
  ONLINE = 'ONLINE',
  BUSY = 'BUSY',
  AWAY = 'AWAY',
  OFFLINE = 'OFFLINE'
}

export enum FunnelStage {
  NOVO_LEAD = 'NOVO_LEAD',
  QUALIFICACAO = 'QUALIFICACAO',
  APRESENTACAO = 'APRESENTACAO',
  PROPOSTA = 'PROPOSTA',
  FOLLOWUP_ATIVO = 'FOLLOWUP_ATIVO',
  FECHADO_GANHO = 'FECHADO_GANHO',
  PERDIDO = 'PERDIDO'
}

export enum LeadContactStatus {
  NAO_CONTATADO = 'NAO_CONTATADO',
  CONTATADO = 'CONTATADO',
  EM_ATENDIMENTO = 'EM_ATENDIMENTO',
  INTERESSADO = 'INTERESSADO',
  NAO_INTERESSADO = 'NAO_INTERESSADO',
  CLIENTE = 'CLIENTE'
}

export enum CallOutcomeStatus {
  ATENDIDA = 'atendida',
  OCUPADO = 'ocupado',
  NAO_ATENDEU = 'nao_atendeu',
  CAIXA_POSTAL = 'caixa_postal',
  REUNIAO_AGENDADA = 'reuniao_agendada',
  SEM_INTERESSE = 'sem_interesse',
  FALHA = 'falha'
}

export enum MessageSender {
  LEAD = 'lead',
  AI = 'ai',
  HUMAN = 'human'
}

export enum MessageChannel {
  WHATSAPP = 'WHATSAPP',
  CHAT_LIVE = 'CHAT_LIVE',
  LIGACAO = 'LIGACAO',
  SMS = 'SMS'
}

export enum FollowupQueueStatus {
  PENDENTE = 'pendente',
  EXECUTADO = 'executado',
  CANCELADO = 'cancelado'
}

export enum FollowupTriggerType {
  DISPOSITION_NAO_ATENDEU = 'DISPOSITION_NAO_ATENDEU',
  DISPOSITION_OCUPADO = 'DISPOSITION_OCUPADO',
  DISPOSITION_INTERESSADO = 'DISPOSITION_INTERESSADO',
  INBOUND_WHATSAPP = 'INBOUND_WHATSAPP',
  STAGE_CHANGED = 'STAGE_CHANGED',
  STAGNANT_PROPOSAL = 'STAGNANT_PROPOSAL',
  MANUAL = 'MANUAL'
}
