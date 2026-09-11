export declare enum WSEventType {
    CHAT_MESSAGE_NEW = "chat:message:new",
    CHAT_MESSAGE_STATUS = "chat:message:status",
    CHAT_CONVERSATION_UPDATED = "chat:conversation:updated",
    CRM_DEAL_CREATED = "crm:deal:created",
    CRM_DEAL_STAGE_CHANGED = "crm:deal:stage_changed",
    CRM_LEAD_CREATED = "crm:lead:created",
    CRM_LEAD_UPDATED = "crm:lead:updated",
    DIALER_CALL_INCOMING = "dialer:call:incoming",
    DIALER_CALL_STATUS = "dialer:call:status",
    DIALER_CALL_ENDED = "dialer:call:ended",
    DIALER_QUEUE_NEXT = "dialer:queue:next",
    AI_FOLLOWUP_TRIGGERED = "ai:followup:triggered",
    AI_AGENT_THINKING = "ai:agent:thinking",
    AI_TOOL_EXECUTED = "ai:tool:executed"
}
export interface WSEventPayload<T = any> {
    type: WSEventType;
    orgId: string;
    data: T;
    timestamp: string;
}
