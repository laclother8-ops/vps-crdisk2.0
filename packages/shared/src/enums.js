"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutomationActionType = exports.AutomationTriggerType = exports.FollowupStatus = exports.DialerCampaignStatus = exports.DialerCampaignType = exports.CallDispositionOutcome = exports.CallStatus = exports.CallDirection = exports.MediaType = exports.MessageStatus = exports.MessageChannel = exports.MessageSenderType = exports.DealStatus = exports.LeadStatus = exports.UserStatus = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["SUPERADMIN"] = "SUPERADMIN";
    UserRole["ADMIN"] = "ADMIN";
    UserRole["MANAGER"] = "MANAGER";
    UserRole["AGENT"] = "AGENT";
    UserRole["AI_BOT"] = "AI_BOT";
})(UserRole || (exports.UserRole = UserRole = {}));
var UserStatus;
(function (UserStatus) {
    UserStatus["ONLINE"] = "ONLINE";
    UserStatus["BUSY"] = "BUSY";
    UserStatus["AWAY"] = "AWAY";
    UserStatus["OFFLINE"] = "OFFLINE";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
var LeadStatus;
(function (LeadStatus) {
    LeadStatus["NEW"] = "NEW";
    LeadStatus["CONTACTED"] = "CONTACTED";
    LeadStatus["QUALIFIED"] = "QUALIFIED";
    LeadStatus["UNQUALIFIED"] = "UNQUALIFIED";
    LeadStatus["IN_NEGOTIATION"] = "IN_NEGOTIATION";
    LeadStatus["WON"] = "WON";
    LeadStatus["LOST"] = "LOST";
})(LeadStatus || (exports.LeadStatus = LeadStatus = {}));
var DealStatus;
(function (DealStatus) {
    DealStatus["OPEN"] = "OPEN";
    DealStatus["WON"] = "WON";
    DealStatus["LOST"] = "LOST";
    DealStatus["ABANDONED"] = "ABANDONED";
})(DealStatus || (exports.DealStatus = DealStatus = {}));
var MessageSenderType;
(function (MessageSenderType) {
    MessageSenderType["USER"] = "USER";
    MessageSenderType["LEAD"] = "LEAD";
    MessageSenderType["AI_AGENT"] = "AI_AGENT";
    MessageSenderType["SYSTEM"] = "SYSTEM";
})(MessageSenderType || (exports.MessageSenderType = MessageSenderType = {}));
var MessageChannel;
(function (MessageChannel) {
    MessageChannel["WHATSAPP"] = "WHATSAPP";
    MessageChannel["WEBCHAT"] = "WEBCHAT";
    MessageChannel["SMS"] = "SMS";
})(MessageChannel || (exports.MessageChannel = MessageChannel = {}));
var MessageStatus;
(function (MessageStatus) {
    MessageStatus["PENDING"] = "PENDING";
    MessageStatus["SENT"] = "SENT";
    MessageStatus["DELIVERED"] = "DELIVERED";
    MessageStatus["READ"] = "READ";
    MessageStatus["FAILED"] = "FAILED";
})(MessageStatus || (exports.MessageStatus = MessageStatus = {}));
var MediaType;
(function (MediaType) {
    MediaType["TEXT"] = "TEXT";
    MediaType["IMAGE"] = "IMAGE";
    MediaType["AUDIO"] = "AUDIO";
    MediaType["DOCUMENT"] = "DOCUMENT";
    MediaType["VIDEO"] = "VIDEO";
})(MediaType || (exports.MediaType = MediaType = {}));
var CallDirection;
(function (CallDirection) {
    CallDirection["INBOUND"] = "INBOUND";
    CallDirection["OUTBOUND"] = "OUTBOUND";
})(CallDirection || (exports.CallDirection = CallDirection = {}));
var CallStatus;
(function (CallStatus) {
    CallStatus["QUEUED"] = "QUEUED";
    CallStatus["RINGING"] = "RINGING";
    CallStatus["IN_PROGRESS"] = "IN_PROGRESS";
    CallStatus["COMPLETED"] = "COMPLETED";
    CallStatus["BUSY"] = "BUSY";
    CallStatus["NO_ANSWER"] = "NO_ANSWER";
    CallStatus["FAILED"] = "FAILED";
    CallStatus["CANCELLED"] = "CANCELLED";
})(CallStatus || (exports.CallStatus = CallStatus = {}));
var CallDispositionOutcome;
(function (CallDispositionOutcome) {
    CallDispositionOutcome["SALE"] = "SALE";
    CallDispositionOutcome["MEETING_SCHEDULED"] = "MEETING_SCHEDULED";
    CallDispositionOutcome["INTERESTED"] = "INTERESTED";
    CallDispositionOutcome["NOT_INTERESTED"] = "NOT_INTERESTED";
    CallDispositionOutcome["NO_ANSWER"] = "NO_ANSWER";
    CallDispositionOutcome["BUSY"] = "BUSY";
    CallDispositionOutcome["WRONG_NUMBER"] = "WRONG_NUMBER";
    CallDispositionOutcome["CALLBACK_REQUESTED"] = "CALLBACK_REQUESTED";
})(CallDispositionOutcome || (exports.CallDispositionOutcome = CallDispositionOutcome = {}));
var DialerCampaignType;
(function (DialerCampaignType) {
    DialerCampaignType["PREVIEW"] = "PREVIEW";
    DialerCampaignType["POWER"] = "POWER";
    DialerCampaignType["PREDICTIVE"] = "PREDICTIVE";
})(DialerCampaignType || (exports.DialerCampaignType = DialerCampaignType = {}));
var DialerCampaignStatus;
(function (DialerCampaignStatus) {
    DialerCampaignStatus["DRAFT"] = "DRAFT";
    DialerCampaignStatus["RUNNING"] = "RUNNING";
    DialerCampaignStatus["PAUSED"] = "PAUSED";
    DialerCampaignStatus["COMPLETED"] = "COMPLETED";
})(DialerCampaignStatus || (exports.DialerCampaignStatus = DialerCampaignStatus = {}));
var FollowupStatus;
(function (FollowupStatus) {
    FollowupStatus["PENDING"] = "PENDING";
    FollowupStatus["EXECUTING"] = "EXECUTING";
    FollowupStatus["COMPLETED"] = "COMPLETED";
    FollowupStatus["FAILED"] = "FAILED";
    FollowupStatus["CANCELLED"] = "CANCELLED";
})(FollowupStatus || (exports.FollowupStatus = FollowupStatus = {}));
var AutomationTriggerType;
(function (AutomationTriggerType) {
    AutomationTriggerType["DISPOSITION_NO_ANSWER"] = "DISPOSITION_NO_ANSWER";
    AutomationTriggerType["DISPOSITION_INTERESTED"] = "DISPOSITION_INTERESTED";
    AutomationTriggerType["DISPOSITION_CALLBACK"] = "DISPOSITION_CALLBACK";
    AutomationTriggerType["DEAL_STAGE_CHANGED"] = "DEAL_STAGE_CHANGED";
    AutomationTriggerType["LEAD_CREATED"] = "LEAD_CREATED";
    AutomationTriggerType["MESSAGE_RECEIVED"] = "MESSAGE_RECEIVED";
})(AutomationTriggerType || (exports.AutomationTriggerType = AutomationTriggerType = {}));
var AutomationActionType;
(function (AutomationActionType) {
    AutomationActionType["SEND_WHATSAPP_AI"] = "SEND_WHATSAPP_AI";
    AutomationActionType["SCHEDULE_CALL"] = "SCHEDULE_CALL";
    AutomationActionType["UPDATE_DEAL_STAGE"] = "UPDATE_DEAL_STAGE";
    AutomationActionType["ASSIGN_LEAD"] = "ASSIGN_LEAD";
    AutomationActionType["CREATE_TASK"] = "CREATE_TASK";
})(AutomationActionType || (exports.AutomationActionType = AutomationActionType = {}));
