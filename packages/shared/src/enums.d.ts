export declare enum UserRole {
    SUPERADMIN = "SUPERADMIN",
    ADMIN = "ADMIN",
    MANAGER = "MANAGER",
    AGENT = "AGENT",
    AI_BOT = "AI_BOT"
}
export declare enum UserStatus {
    ONLINE = "ONLINE",
    BUSY = "BUSY",
    AWAY = "AWAY",
    OFFLINE = "OFFLINE"
}
export declare enum LeadStatus {
    NEW = "NEW",
    CONTACTED = "CONTACTED",
    QUALIFIED = "QUALIFIED",
    UNQUALIFIED = "UNQUALIFIED",
    IN_NEGOTIATION = "IN_NEGOTIATION",
    WON = "WON",
    LOST = "LOST"
}
export declare enum DealStatus {
    OPEN = "OPEN",
    WON = "WON",
    LOST = "LOST",
    ABANDONED = "ABANDONED"
}
export declare enum MessageSenderType {
    USER = "USER",
    LEAD = "LEAD",
    AI_AGENT = "AI_AGENT",
    SYSTEM = "SYSTEM"
}
export declare enum MessageChannel {
    WHATSAPP = "WHATSAPP",
    WEBCHAT = "WEBCHAT",
    SMS = "SMS"
}
export declare enum MessageStatus {
    PENDING = "PENDING",
    SENT = "SENT",
    DELIVERED = "DELIVERED",
    READ = "READ",
    FAILED = "FAILED"
}
export declare enum MediaType {
    TEXT = "TEXT",
    IMAGE = "IMAGE",
    AUDIO = "AUDIO",
    DOCUMENT = "DOCUMENT",
    VIDEO = "VIDEO"
}
export declare enum CallDirection {
    INBOUND = "INBOUND",
    OUTBOUND = "OUTBOUND"
}
export declare enum CallStatus {
    QUEUED = "QUEUED",
    RINGING = "RINGING",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED",
    BUSY = "BUSY",
    NO_ANSWER = "NO_ANSWER",
    FAILED = "FAILED",
    CANCELLED = "CANCELLED"
}
export declare enum CallDispositionOutcome {
    SALE = "SALE",
    MEETING_SCHEDULED = "MEETING_SCHEDULED",
    INTERESTED = "INTERESTED",
    NOT_INTERESTED = "NOT_INTERESTED",
    NO_ANSWER = "NO_ANSWER",
    BUSY = "BUSY",
    WRONG_NUMBER = "WRONG_NUMBER",
    CALLBACK_REQUESTED = "CALLBACK_REQUESTED"
}
export declare enum DialerCampaignType {
    PREVIEW = "PREVIEW",
    POWER = "POWER",
    PREDICTIVE = "PREDICTIVE"
}
export declare enum DialerCampaignStatus {
    DRAFT = "DRAFT",
    RUNNING = "RUNNING",
    PAUSED = "PAUSED",
    COMPLETED = "COMPLETED"
}
export declare enum FollowupStatus {
    PENDING = "PENDING",
    EXECUTING = "EXECUTING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    CANCELLED = "CANCELLED"
}
export declare enum AutomationTriggerType {
    DISPOSITION_NO_ANSWER = "DISPOSITION_NO_ANSWER",
    DISPOSITION_INTERESTED = "DISPOSITION_INTERESTED",
    DISPOSITION_CALLBACK = "DISPOSITION_CALLBACK",
    DEAL_STAGE_CHANGED = "DEAL_STAGE_CHANGED",
    LEAD_CREATED = "LEAD_CREATED",
    MESSAGE_RECEIVED = "MESSAGE_RECEIVED"
}
export declare enum AutomationActionType {
    SEND_WHATSAPP_AI = "SEND_WHATSAPP_AI",
    SCHEDULE_CALL = "SCHEDULE_CALL",
    UPDATE_DEAL_STAGE = "UPDATE_DEAL_STAGE",
    ASSIGN_LEAD = "ASSIGN_LEAD",
    CREATE_TASK = "CREATE_TASK"
}
