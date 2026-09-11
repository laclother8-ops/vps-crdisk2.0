import { FastifyInstance } from 'fastify';
import { chatService } from './chat.service.js';
import { whatsappService } from './whatsapp.service.js';
import { ConversationFilter, MessageChannel, MessageSender, SendMessageSchema, TransferConversationSchema } from '@omnicrm/shared';

export async function chatRoutes(app: FastifyInstance) {
  // List Conversations with optional tab filter and channel filter
  app.get('/conversations', async (req) => {
    const { filter, channel } = req.query as { filter?: ConversationFilter; channel?: string };
    return await chatService.listConversations(filter, channel);
  });

  // Get Canned Response Templates
  app.get('/templates', async () => {
    return chatService.getTemplates();
  });

  // Get Messages by Lead
  app.get('/leads/:leadId/messages', async (req) => {
    const { leadId } = req.params as { leadId: string };
    return await chatService.getMessagesByLead(leadId);
  });

  // Send Message (Text, Audio, Image, Document)
  app.post('/messages', async (req, reply) => {
    const parsed = SendMessageSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.format() });
    }
    return await chatService.sendMessage(
      parsed.data.leadId,
      parsed.data.content,
      parsed.data.sender as MessageSender,
      parsed.data.channel as MessageChannel,
      parsed.data.type as any,
      parsed.data.mediaUrl,
      parsed.data.duration
    );
  });

  // Toggle Human Mode vs AI Mode
  app.patch('/conversations/:leadId/human-mode', async (req, reply) => {
    const { leadId } = req.params as { leadId: string };
    const { isHuman } = req.body as { isHuman: boolean };
    return await chatService.toggleHumanMode(leadId, Boolean(isHuman));
  });

  // Transfer Conversation to operator / department
  app.post('/conversations/:leadId/transfer', async (req, reply) => {
    const { leadId } = req.params as { leadId: string };
    const parsed = TransferConversationSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.format() });
    }
    return await chatService.transferConversation(
      leadId, 
      parsed.data.targetUserId, 
      parsed.data.targetDepartment, 
      parsed.data.notes
    );
  });

  // Notify Typing Status
  app.post('/conversations/:leadId/typing', async (req) => {
    const { leadId } = req.params as { leadId: string };
    const { sender } = req.body as { sender?: 'human' | 'lead' };
    return await chatService.notifyTyping(leadId, sender || 'human');
  });

  // Meta WhatsApp Cloud API Webhook Handshake (GET)
  app.get('/webhooks/whatsapp', async (req, reply) => {
    const query = req.query as {
      'hub.mode'?: string;
      'hub.verify_token'?: string;
      'hub.challenge'?: string;
    };

    const mode = query['hub.mode'];
    const token = query['hub.verify_token'];
    const challenge = query['hub.challenge'];

    const verified = whatsappService.verifyWebhook(mode, token, challenge);
    if (verified) {
      reply.header('Content-Type', 'text/plain');
      return reply.status(200).send(challenge);
    }
    return reply.status(403).send('Forbidden: Invalid Verification Token');
  });

  // Meta WhatsApp Cloud API Webhook Event Receiver (POST)
  app.post('/webhooks/whatsapp', async (req, reply) => {
    const body = req.body as any;

    const { messages, statuses } = whatsappService.parseWebhookPayload(body);

    // Process inbound messages
    for (const msg of messages) {
      await chatService.handleInboundWhatsApp(msg);
    }

    // Process delivery status updates (sent, delivered, read)
    for (const status of statuses) {
      await chatService.handleDeliveryStatus(status);
    }

    return reply.status(200).send({ status: 'EVENT_RECEIVED', processedMessages: messages.length, processedStatuses: statuses.length });
  });
}
