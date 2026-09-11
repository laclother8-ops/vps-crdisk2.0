"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppWebhookPayloadSchema = exports.SendMessageSchema = void 0;
const zod_1 = require("zod");
const enums_js_1 = require("./enums.js");
exports.SendMessageSchema = zod_1.z.object({
    conversationId: zod_1.z.string().uuid(),
    content: zod_1.z.string().min(1, 'Mensagem não pode estar vazia'),
    mediaUrl: zod_1.z.string().url().optional().nullable(),
    mediaType: zod_1.z.nativeEnum(enums_js_1.MediaType).default(enums_js_1.MediaType.TEXT),
    metadata: zod_1.z.record(zod_1.z.any()).optional()
});
exports.WhatsAppWebhookPayloadSchema = zod_1.z.object({
    object: zod_1.z.string(),
    entry: zod_1.z.array(zod_1.z.any())
});
