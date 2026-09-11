import { z } from 'zod';
import { MessageChannel, MessageSender } from './enums.js';
import { Lead } from './crm.types.js';

export type MessageType = 'text' | 'audio' | 'image' | 'document';
export type DeliveryStatus = 'sent' | 'delivered' | 'read' | 'failed';
export type ConversationFilter = 'all' | 'mine' | 'unassigned' | 'ai' | 'closed';

export interface Message {
  id: string;
  leadId: string;
  sender: MessageSender;
  content: string;
  channel: MessageChannel;
  type?: MessageType;
  mediaUrl?: string;
  duration?: number; // seconds for audio
  status?: DeliveryStatus;
  createdAt: Date;
  lead?: Lead | null;
}

export interface Conversation {
  id: string;
  leadId: string;
  lead?: Lead | null;
  channel: MessageChannel;
  status: 'OPEN' | 'PENDING' | 'CLOSED';
  aiHandled: boolean;
  isHumanHandled?: boolean;
  assignedTo?: string | null;
  assignedDepartment?: string | null;
  lastMessageAt: Date;
  lastMessage?: Message | null;
  unreadCount?: number;
  createdAt: Date;
}

export interface CannedResponseTemplate {
  id: string;
  title: string;
  content: string;
  shortcut: string;
  category: 'saudacao' | 'qualificacao' | 'proposta' | 'fechamento' | 'suporte';
}

export const SendMessageSchema = z.object({
  leadId: z.string(),
  content: z.string().min(1, 'Mensagem não pode estar vazia'),
  channel: z.nativeEnum(MessageChannel).default(MessageChannel.WHATSAPP),
  sender: z.nativeEnum(MessageSender).default(MessageSender.HUMAN),
  type: z.enum(['text', 'audio', 'image', 'document']).default('text'),
  mediaUrl: z.string().optional(),
  duration: z.number().optional()
});

export const TransferConversationSchema = z.object({
  targetUserId: z.string().optional(),
  targetDepartment: z.string().optional(),
  notes: z.string().optional()
});

export const WhatsAppWebhookPayloadSchema = z.object({
  object: z.string().optional(),
  entry: z.array(z.any()).optional()
});
