"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IngestDocumentSchema = exports.QueryRAGSchema = void 0;
const zod_1 = require("zod");
exports.QueryRAGSchema = zod_1.z.object({
    knowledgeBaseId: zod_1.z.string().uuid(),
    query: zod_1.z.string().min(2),
    topK: zod_1.z.number().default(4),
    minSimilarity: zod_1.z.number().default(0.7)
});
exports.IngestDocumentSchema = zod_1.z.object({
    knowledgeBaseId: zod_1.z.string().uuid(),
    title: zod_1.z.string().min(2),
    content: zod_1.z.string().min(10),
    sourceType: zod_1.z.enum(['PDF', 'TXT', 'URL', 'MANUAL']).default('MANUAL')
});
