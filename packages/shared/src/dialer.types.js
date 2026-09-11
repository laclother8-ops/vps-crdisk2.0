"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InitiateCallSchema = exports.CreateCallDispositionSchema = void 0;
const zod_1 = require("zod");
const enums_js_1 = require("./enums.js");
exports.CreateCallDispositionSchema = zod_1.z.object({
    callId: zod_1.z.string().uuid(),
    outcome: zod_1.z.nativeEnum(enums_js_1.CallDispositionOutcome),
    notes: zod_1.z.string().optional().nullable(),
    scheduledCallbackAt: zod_1.z.string().or(zod_1.z.date()).optional().nullable(),
    triggerFollowup: zod_1.z.boolean().default(true)
});
exports.InitiateCallSchema = zod_1.z.object({
    leadId: zod_1.z.string().uuid(),
    campaignId: zod_1.z.string().uuid().optional().nullable(),
    fromNumber: zod_1.z.string().optional()
});
