import { z } from 'zod';
import { FollowupQueueStatus, FollowupTriggerType } from './enums.js';
import { Lead } from './crm.types.js';

export interface AIAgent {
  id: string;
  orgId: string;
  name: string;
  model: string;
  systemPrompt: string;
  temperature: number;
  knowledgeBaseId?: string | null;
  autoReplyWhatsApp: boolean;
  createdAt: Date;
}

export interface FollowupQueueItem {
  id: string;
  leadId: string;
  triggerType: FollowupTriggerType;
  scheduledFor: Date;
  status: FollowupQueueStatus;
  step: number;
  lead?: Lead | null;
  createdAt: Date;
}

export interface KnowledgeBaseItem {
  id: string;
  title: string;
  content: string;
  embedding?: number[];
  category: string;
  createdAt: Date;
}

export const CreateKnowledgeBaseSchema = z.object({
  title: z.string().min(2, 'Título é obrigatório'),
  content: z.string().min(10, 'Conteúdo muito curto'),
  category: z.string().default('GERAL')
});

export const QueryKnowledgeBaseSchema = z.object({
  query: z.string().min(2),
  category: z.string().optional(),
  limit: z.number().default(4)
});
