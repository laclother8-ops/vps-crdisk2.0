import { z } from 'zod';
import { MediaType, MessageChannel, MessageSenderType, MessageStatus } from './enums.js';
import { Lead } from './crm.types.js';
export interface Conversation {
    id: string;
    orgId: string;
    leadId: string;
    lead?: Lead | null;
    channel: MessageChannel;
    externalChatId: string;
    status: 'OPEN' | 'PENDING' | 'CLOSED';
    aiHandled: boolean;
    assignedTo?: string | null;
    lastMessageAt: Date;
    unreadCount?: number;
    lastMessage?: Message | null;
    createdAt: Date;
}
export interface Message {
    id: string;
    conversationId: string;
    senderType: MessageSenderType;
    senderId?: string | null;
    content: string;
    mediaUrl?: string | null;
    mediaType: MediaType;
    status: MessageStatus;
    metadata?: Record<string, any> | null;
    createdAt: Date;
}
export declare const SendMessageSchema: z.ZodObject<{
    conversationId: z.ZodString;
    content: z.ZodString;
    mediaUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    mediaType: z.ZodDefault<z.ZodNativeEnum<typeof MediaType>>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    content: string;
    conversationId: string;
    mediaType: MediaType;
    mediaUrl?: string | null | undefined;
    metadata?: Record<string, any> | undefined;
}, {
    content: string;
    conversationId: string;
    mediaUrl?: string | null | undefined;
    mediaType?: MediaType | undefined;
    metadata?: Record<string, any> | undefined;
}>;
export declare const WhatsAppWebhookPayloadSchema: z.ZodObject<{
    object: z.ZodString;
    entry: z.ZodArray<z.ZodAny, "many">;
}, "strip", z.ZodTypeAny, {
    object: string;
    entry: any[];
}, {
    object: string;
    entry: any[];
}>;
