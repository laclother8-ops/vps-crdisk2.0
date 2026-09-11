import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { billingService } from './billing.service.js';
import { SAAS_PLANS } from './billing.types.js';
import { workspaceService } from '../workspaces/workspace.service.js';

export const billingRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  /**
   * GET /api/billing/plans
   * List all available plans
   */
  fastify.get('/plans', async (_req, reply) => {
    return reply.send({
      success: true,
      plans: Object.values(SAAS_PLANS)
    });
  });

  /**
   * POST /api/billing/create-checkout-session
   * Create Checkout session (Stripe or Mercado Pago)
   */
  fastify.post('/create-checkout-session', async (req, reply) => {
    try {
      const body = req.body as any || {};
      const planId = body.planId || body.plan || 'pro';
      const workspaceId = body.workspaceId || (req as any).user?.workspaceId || '11111111-3333-3333-3333-333333333333';
      const provider = body.provider || process.env.DEFAULT_PAYMENT_PROVIDER || 'stripe';
      const paymentMethod = body.paymentMethod || 'all';

      const checkout = await billingService.createCheckoutSession({
        planId,
        workspaceId,
        provider,
        paymentMethod,
        customerName: body.customerName,
        customerEmail: body.customerEmail,
        customerPhone: body.customerPhone
      });

      return reply.send({
        success: true,
        checkout
      });
    } catch (err: any) {
      req.log.error({ err }, 'Error generating checkout session');
      return reply.status(500).send({ error: 'Erro ao gerar sessão de checkout', details: err.message });
    }
  });

  /**
   * GET /api/billing/status/:workspaceId
   * Real-time polling endpoint for Pix and Card status check
   */
  fastify.get('/status/:workspaceId', async (req, reply) => {
    try {
      const { workspaceId } = req.params as { workspaceId: string };
      const workspace = await workspaceService.getWorkspaceById(workspaceId);

      if (!workspace) {
        return reply.status(404).send({ error: 'Workspace não encontrado' });
      }

      const isUnlocked = workspace.subscriptionStatus === 'active' || 
        (workspace.subscriptionStatus === 'trial' && (!workspace.trialEndsAt || new Date() < new Date(workspace.trialEndsAt)));

      return reply.send({
        workspaceId: workspace.id,
        workspaceName: workspace.name,
        subscriptionStatus: workspace.subscriptionStatus || 'pending_payment',
        subscriptionPlan: workspace.subscriptionPlan || workspace.plan || 'pro',
        currentPeriodEnd: workspace.currentPeriodEnd,
        trialEndsAt: workspace.trialEndsAt,
        isUnlocked,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      return reply.status(500).send({ error: 'Erro ao verificar status de faturamento' });
    }
  });

  /**
   * POST /api/billing/webhooks/stripe
   * Stripe Webhook Handler
   */
  fastify.post('/webhooks/stripe', async (req, reply) => {
    const result = await billingService.handleWebhook('stripe', req.body, req.headers);
    return reply.status(200).send({ received: true, result });
  });

  /**
   * POST /api/billing/webhooks/mercadopago
   * Mercado Pago Webhook Handler
   */
  fastify.post('/webhooks/mercadopago', async (req, reply) => {
    const result = await billingService.handleWebhook('mercadopago', req.body, req.headers);
    return reply.status(200).send({ received: true, result });
  });

  /**
   * POST /api/billing/webhooks/universal
   * Universal Webhook Handler
   */
  fastify.post('/webhooks/universal', async (req, reply) => {
    const body = req.body as any || {};
    const provider = (body.provider || process.env.DEFAULT_PAYMENT_PROVIDER || 'stripe') as any;
    const result = await billingService.handleWebhook(provider, body, req.headers);
    return reply.status(200).send({ received: true, result });
  });
};
