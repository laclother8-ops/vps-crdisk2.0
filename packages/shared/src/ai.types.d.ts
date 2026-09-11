import { z } from 'zod';
import { AutomationActionType, AutomationTriggerType, FollowupStatus } from './enums.js';
export interface KnowledgeBase {
    id: string;
    orgId: string;
    name: string;
    description?: string | null;
    isActive: boolean;
    documentsCount?: number;
    createdAt: Date;
}
export interface KnowledgeDocument {
    id: string;
    knowledgeBaseId: string;
    title: string;
    sourceType: 'PDF' | 'TXT' | 'URL' | 'MANUAL';
    sourceUrl?: string | null;
    status: 'PROCESSING' | 'READY' | 'ERROR';
    chunksCount?: number;
    createdAt: Date;
}
export interface DocumentChunk {
    id: string;
    documentId: string;
    content: string;
    chunkIndex: number;
    metadata?: Record<string, any> | null;
    embedding?: number[];
    similarityScore?: number;
}
export interface AIAgent {
    id: string;
    orgId: string;
    name: string;
    model: string;
    systemPrompt: string;
    temperature: number;
    knowledgeBaseId?: string | null;
    autoReplyWhatsApp: boolean;
    tools?: AgentTool[];
    createdAt: Date;
}
export interface AgentTool {
    id: string;
    agentId: string;
    name: string;
    description: string;
    parametersSchema: Record<string, any>;
    isActive: boolean;
}
export interface AutomationRule {
    id: string;
    orgId: string;
    name: string;
    triggerEvent: AutomationTriggerType;
    condition?: Record<string, any> | null;
    actionType: AutomationActionType;
    actionPayload: Record<string, any>;
    isActive: boolean;
    createdAt: Date;
}
export interface Followup {
    id: string;
    orgId: string;
    leadId: string;
    ruleId?: string | null;
    channel: string;
    scheduledFor: Date;
    status: FollowupStatus;
    executionLog?: Record<string, any> | null;
    createdAt: Date;
}
export declare const QueryRAGSchema: z.ZodObject<{
    knowledgeBaseId: z.ZodString;
    query: z.ZodString;
    topK: z.ZodDefault<z.ZodNumber>;
    minSimilarity: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    knowledgeBaseId: string;
    query: string;
    topK: number;
    minSimilarity: number;
}, {
    knowledgeBaseId: string;
    query: string;
    topK?: number | undefined;
    minSimilarity?: number | undefined;
}>;
export declare const IngestDocumentSchema: z.ZodObject<{
    knowledgeBaseId: z.ZodString;
    title: z.ZodString;
    content: z.ZodString;
    sourceType: z.ZodDefault<z.ZodEnum<["PDF", "TXT", "URL", "MANUAL"]>>;
}, "strip", z.ZodTypeAny, {
    knowledgeBaseId: string;
    title: string;
    content: string;
    sourceType: "PDF" | "TXT" | "URL" | "MANUAL";
}, {
    knowledgeBaseId: string;
    title: string;
    content: string;
    sourceType?: "PDF" | "TXT" | "URL" | "MANUAL" | undefined;
}>;
