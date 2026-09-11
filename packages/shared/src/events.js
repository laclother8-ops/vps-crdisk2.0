"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WSEventType = void 0;
var WSEventType;
(function (WSEventType) {
    // Chat events
    WSEventType["CHAT_MESSAGE_NEW"] = "chat:message:new";
    WSEventType["CHAT_MESSAGE_STATUS"] = "chat:message:status";
    WSEventType["CHAT_CONVERSATION_UPDATED"] = "chat:conversation:updated";
    // CRM events
    WSEventType["CRM_DEAL_CREATED"] = "crm:deal:created";
    WSEventType["CRM_DEAL_STAGE_CHANGED"] = "crm:deal:stage_changed";
    WSEventType["CRM_LEAD_CREATED"] = "crm:lead:created";
    WSEventType["CRM_LEAD_UPDATED"] = "crm:lead:updated";
    // Dialer / WebRTC events
    WSEventType["DIALER_CALL_INCOMING"] = "dialer:call:incoming";
    WSEventType["DIALER_CALL_STATUS"] = "dialer:call:status";
    WSEventType["DIALER_CALL_ENDED"] = "dialer:call:ended";
    WSEventType["DIALER_QUEUE_NEXT"] = "dialer:queue:next";
    // AI & Automation events
    WSEventType["AI_FOLLOWUP_TRIGGERED"] = "ai:followup:triggered";
    WSEventType["AI_AGENT_THINKING"] = "ai:agent:thinking";
    WSEventType["AI_TOOL_EXECUTED"] = "ai:tool:executed";
})(WSEventType || (exports.WSEventType = WSEventType = {}));
