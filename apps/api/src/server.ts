import fastify from 'fastify';
import cors from '@fastify/cors';
import websocketPlugin from '@fastify/websocket';
import { config } from './config.js';
import { WebSocketGateway } from './websocket/ws.gateway.js';
import { crmRoutes } from './modules/crm/crm.routes.js';
import { chatRoutes } from './modules/chat/chat.routes.js';
import { telephonyRoutes } from './modules/telephony/telephony.routes.js';
import { aiRoutes } from './modules/ai/ai.routes.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { settingsRoutes } from './modules/settings/settings.routes.js';
import { workspaceRoutes } from './modules/workspaces/workspace.routes.js';
import { teamRoutes } from './modules/team/team.routes.js';

const app = fastify({
  logger: {
    level: config.nodeEnv === 'development' ? 'info' : 'warn'
  }
});

async function bootstrap() {
  // CORS configuration
  await app.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true
  });

  // WebSocket Server
  await app.register(websocketPlugin);

  app.get('/ws', { websocket: true }, (socket: any) => {
    const ws = socket.socket || socket;
    WebSocketGateway.getInstance().addClient(ws);
    ws.send(JSON.stringify({
      type: 'system:connected',
      message: 'Conectado ao OmniCRM Realtime Gateway'
    }));
  });

  // Health check endpoint
  app.get('/health', async () => {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        crm: 'online',
        chat: 'online',
        dialer: 'online',
        ai_engine: 'online'
      }
    };
  });

  // Top-level WhatsApp Cloud API Webhook routes for direct webhook verification
  app.get('/api/webhooks/whatsapp', async (req, reply) => {
    const { whatsappService } = await import('./modules/chat/whatsapp.service.js');
    const query = req.query as {
      'hub.mode'?: string;
      'hub.verify_token'?: string;
      'hub.challenge'?: string;
    };
    const verified = whatsappService.verifyWebhook(query['hub.mode'], query['hub.verify_token'], query['hub.challenge']);
    if (verified) {
      reply.header('Content-Type', 'text/plain');
      return reply.status(200).send(query['hub.challenge']);
    }
    return reply.status(403).send('Forbidden: Invalid Verification Token');
  });

  app.post('/api/webhooks/whatsapp', async (req, reply) => {
    const { whatsappService } = await import('./modules/chat/whatsapp.service.js');
    const { chatService } = await import('./modules/chat/chat.service.js');
    const { messages, statuses } = whatsappService.parseWebhookPayload(req.body);

    for (const msg of messages) {
      await chatService.handleInboundWhatsApp(msg);
    }
    for (const status of statuses) {
      await chatService.handleDeliveryStatus(status);
    }
    return reply.status(200).send({ status: 'EVENT_RECEIVED', processedMessages: messages.length, processedStatuses: statuses.length });
  });

  // Top-level Payment Gateway Webhook (Stripe / Asaas / Pix)
  app.post('/api/webhooks/payment', async (req, reply) => {
    const { workspaceService } = await import('./modules/workspaces/workspace.service.js');
    const body = req.body as any || {};

    // Standardize event format across gateways
    const eventType = body.event || body.type || body.event_type || 'payment.succeeded';
    const workspaceId = body.workspaceId || body.workspace_id || body.metadata?.workspaceId || body.metadata?.workspace_id;
    const customerId = body.customerId || body.customer_id || body.customer || body.data?.object?.customer;
    const subscriptionId = body.subscriptionId || body.subscription_id || body.subscription || body.data?.object?.subscription;
    const plan = body.plan || body.subscriptionPlan || body.metadata?.plan || 'pro';
    const amount = body.amount || body.value || body.data?.object?.amount_total;

    console.log(`[Webhook] Received payment event "${eventType}" for workspaceId="${workspaceId}", customerId="${customerId}"`);

    const result = await workspaceService.handlePaymentWebhook({
      type: eventType,
      workspaceId,
      customerId,
      subscriptionId,
      plan,
      amount
    });

    return reply.status(200).send({
      received: true,
      result
    });
  });

  // Top-level Billing Webhooks for Stripe and Mercado Pago
  app.post('/api/webhooks/billing', async (req, reply) => {
    const { billingService } = await import('./modules/billing/billing.service.js');
    const body = req.body as any || {};
    const provider = (body.provider || (req.headers['stripe-signature'] ? 'stripe' : (req.headers['x-signature'] ? 'mercadopago' : (process.env.DEFAULT_PAYMENT_PROVIDER || 'stripe')))) as any;
    const result = await billingService.handleWebhook(provider, body, req.headers);
    return reply.status(200).send({ received: true, result });
  });

  // API Module Routes
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(crmRoutes, { prefix: '/api/crm' });
  await app.register(chatRoutes, { prefix: '/api/chat' });
  await app.register(telephonyRoutes, { prefix: '/api/telephony' });
  await app.register(aiRoutes, { prefix: '/api/ai' });
  await app.register(settingsRoutes, { prefix: '/api/settings' });
  await app.register(workspaceRoutes, { prefix: '/api/admin/workspaces' });
  await app.register(teamRoutes, { prefix: '/api/team' });
  const { billingRoutes } = await import('./modules/billing/billing.routes.js');
  await app.register(billingRoutes, { prefix: '/api/billing' });

  try {
    await app.listen({ port: config.port, host: '0.0.0.0' });
    console.log(`🚀 OmniCRM Backend API running on http://localhost:${config.port}`);
    console.log(`📡 WebSocket Gateway ready at ws://localhost:${config.port}/ws`);

    // Start background intelligent follow-up worker (runs every 5 minutes)
    const { followupWorker } = await import('./modules/crm/followup.worker.js');
    followupWorker.startCron(5 * 60 * 1000);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

bootstrap();

