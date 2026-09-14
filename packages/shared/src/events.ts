export enum WSEventType {
  // Chat events
  CHAT_MESSAGE_NEW = 'chat:message:new',
  CHAT_MESSAGE_STATUS = 'chat:message:status',
  CHAT_CONVERSATION_UPDATED = 'chat:conversation:updated',
  CHAT_TYPING = 'chat:typing',
  CHAT_HUMAN_MODE_TOGGLED = 'chat:human_mode:toggled',
  CHAT_CONVERSATION_TRANSFERRED = 'chat:conversation:transferred',
  
  // CRM events
  CRM_DEAL_CREATED = 'crm:deal:created',
  CRM_DEAL_STAGE_CHANGED = 'crm:deal:stage_changed',
  CRM_LEAD_CREATED = 'crm:lead:created',
  CRM_LEAD_UPDATED = 'crm:lead:updated',
  
  // Dialer / WebRTC events
  DIALER_CALL_INCOMING = 'dialer:call:incoming',
  DIALER_CALL_STATUS = 'dialer:call:status',
  DIALER_CALL_ENDED = 'dialer:call:ended',
  DIALER_QUEUE_NEXT = 'dialer:queue:next',
  
  // AI & Automation events
  AI_FOLLOWUP_TRIGGERED = 'ai:followup:triggered',
  AI_AGENT_THINKING = 'ai:agent:thinking',
  AI_TOOL_EXECUTED = 'ai:tool:executed',
  AGENT_TAKEOVER_ALERT = 'agent:takeover:alert',

  // Billing events
  BILLING_PAYMENT_APPROVED = 'billing:payment:approved',
  BILLING_PAYMENT_FAILED = 'billing:payment:failed'
}

export interface WSEventPayload<T = any> {
  type: WSEventType;
  orgId: string;
  data: T;
  timestamp: string;
}
