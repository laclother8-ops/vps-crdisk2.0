"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateDealStageSchema = exports.CreateDealSchema = exports.CreateLeadSchema = void 0;
const zod_1 = require("zod");
const enums_js_1 = require("./enums.js");
exports.CreateLeadSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Nome é obrigatório'),
    phone: zod_1.z.string().min(8, 'Telefone inválido'),
    email: zod_1.z.string().email('E-mail inválido').optional().nullable(),
    company: zod_1.z.string().optional().nullable(),
    status: zod_1.z.nativeEnum(enums_js_1.LeadStatus).default(enums_js_1.LeadStatus.NEW),
    score: zod_1.z.number().default(0),
    customFields: zod_1.z.record(zod_1.z.any()).optional(),
    assignedTo: zod_1.z.string().uuid().optional().nullable()
});
exports.CreateDealSchema = zod_1.z.object({
    leadId: zod_1.z.string().uuid(),
    stageId: zod_1.z.string().uuid(),
    title: zod_1.z.string().min(2, 'Título é obrigatório'),
    value: zod_1.z.number().min(0, 'Valor deve ser positivo'),
    currency: zod_1.z.string().default('BRL'),
    status: zod_1.z.nativeEnum(enums_js_1.DealStatus).default(enums_js_1.DealStatus.OPEN),
    expectedCloseDate: zod_1.z.string().or(zod_1.z.date()).optional().nullable(),
    assignedTo: zod_1.z.string().uuid().optional().nullable()
});
exports.UpdateDealStageSchema = zod_1.z.object({
    dealId: zod_1.z.string().uuid(),
    stageId: zod_1.z.string().uuid(),
    newOrder: zod_1.z.number().optional()
});
