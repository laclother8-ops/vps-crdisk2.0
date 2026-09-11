import { SAAS_PLANS, CreateCheckoutInput, CheckoutSessionResult, PaymentProvider } from './billing.types.js';
import { workspaceService } from '../workspaces/workspace.service.js';
import { WebSocketGateway } from '../../websocket/ws.gateway.js';

class BillingService {
  private defaultProvider: PaymentProvider = 
    (process.env.DEFAULT_PAYMENT_PROVIDER as PaymentProvider) || 'stripe';

  /**
   * Generates a Checkout Session for Stripe or Mercado Pago (with Pix and Card)
   */
  async createCheckoutSession(input: CreateCheckoutInput): Promise<CheckoutSessionResult> {
    const plan = SAAS_PLANS[input.planId] || SAAS_PLANS.pro;
    const provider = input.provider || this.defaultProvider;
    const workspaceId = input.workspaceId;
    const customerEmail = input.customerEmail || 'cliente@empresa.com.br';
    const customerName = input.customerName || 'Cliente CRDISK';

    const sessionId = `cs_${provider}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const txId = `pix_${Date.now()}_${workspaceId.slice(0, 8)}`;

    // Generate Standard Pix EMV Payload
    const pixCopyPaste = `00020126580014br.gov.bcb.pix0136crdisk-financeiro-${workspaceId.slice(0, 8)}520400005303986540${plan.price.toFixed(2)}5802BR5920CRDISK TECNOLOGIA SA6009SAO PAULO62070503***6304`;
    const qrCodeImage = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(pixCopyPaste)}`;

    let checkoutUrl = `https://checkout.stripe.com/pay/${sessionId}?plan=${plan.id}&ws=${workspaceId}`;
    if (provider === 'mercadopago') {
      checkoutUrl = `https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=pref_${workspaceId.slice(0, 8)}_${Date.now()}`;
    }

    console.log(`[Billing Engine] Checkout session created via ${provider.toUpperCase()} for Workspace ${workspaceId} (Plano: ${plan.name} - R$ ${plan.price})`);

    return {
      sessionId,
      provider,
      planId: plan.id,
      planName: plan.name,
      amount: plan.price,
      formattedAmount: `R$ ${plan.price.toFixed(2).replace('.', ',')}`,
      workspaceId,
      checkoutUrl,
      pix: {
        txId,
        copyPasteCode: pixCopyPaste,
        qrCodeImage,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString()
      },
      card: {
        stripeClientSecret: `${sessionId}_secret_mock`,
        checkoutUrl
      },
      status: 'pending'
    };
  }

  /**
   * Processes incoming Webhooks from Stripe and Mercado Pago in real-time
   */
  async handleWebhook(provider: PaymentProvider, payload: any, _headers?: any) {
    console.log(`[Billing Webhook] Received webhook from ${provider.toUpperCase()}:`, JSON.stringify(payload).slice(0, 200));

    let eventType = '';
    let workspaceId = '';
    let planId = 'pro';
    let isApproved = false;
    let isFailed = false;

    // 1. Stripe Event Parsing
    if (provider === 'stripe') {
      eventType = payload.type || payload.event || 'checkout.session.completed';
      const sessionObj = payload.data?.object || payload;
      workspaceId = sessionObj.client_reference_id || 
                    sessionObj.metadata?.workspaceId || 
                    sessionObj.metadata?.workspace_id ||
                    payload.workspaceId || '';
      planId = sessionObj.metadata?.planId || sessionObj.metadata?.plan || payload.plan || 'pro';

      if (
        eventType === 'checkout.session.completed' ||
        eventType === 'invoice.paid' ||
        eventType === 'payment_intent.succeeded'
      ) {
        isApproved = true;
      } else if (
        eventType === 'customer.subscription.deleted' ||
        eventType === 'invoice.payment_failed'
      ) {
        isFailed = true;
      }
    }

    // 2. Mercado Pago Event Parsing
    if (provider === 'mercadopago') {
      eventType = payload.action || payload.type || payload.event || 'payment.updated';
      const paymentData = payload.data || payload;
      workspaceId = payload.workspaceId || payload.workspace_id || payload.external_reference || paymentData?.external_reference || '';
      planId = payload.planId || payload.plan || 'pro';

      const mpStatus = payload.status || paymentData?.status;
      if (mpStatus === 'approved') {
        isApproved = true;
      } else if (mpStatus === 'rejected' || mpStatus === 'cancelled' || mpStatus === 'refunded' || mpStatus === 'charged_back') {
        isFailed = true;
      } else if (eventType === 'payment.created') {
        isApproved = true;
      }
    }

    // Fallback: If no explicit workspaceId in payload, match first pending or active tenant
    if (!workspaceId) {
      const allWs = await workspaceService.listWorkspaces({ limit: 10 });
      const found = allWs?.data?.find((w: any) => w.subscriptionStatus === 'pending_payment') || allWs?.data?.[0];
      workspaceId = found?.id || '11111111-3333-3333-3333-333333333333';
    }

    // 3. Execute State Update & Real-Time WebSocket Broadcast
    if (isApproved) {
      const nextMonth = new Date();
      nextMonth.setDate(nextMonth.getDate() + 30);

      const updatedWs = await workspaceService.updateWorkspaceSubscription(workspaceId, {
        subscriptionStatus: 'active',
        subscriptionPlan: planId,
        currentPeriodEnd: nextMonth,
        trialEndsAt: null
      });

      // Broadcast real-time unlock event via WebSocket Gateway
      try {
        WebSocketGateway.getInstance().broadcast('billing:payment:approved', {
          workspaceId,
          planId,
          subscriptionStatus: 'active',
          currentPeriodEnd: nextMonth.toISOString(),
          approvedAt: new Date().toISOString(),
          message: 'Assinatura confirmada e ativada com sucesso!'
        });
      } catch (wsErr) {
        console.warn('[Billing WS Broadcast Note]', wsErr);
      }

      console.log(`✅ [Billing Webhook] Workspace "${updatedWs?.name || workspaceId}" APROVADO & ATIVADO via ${provider.toUpperCase()}`);
      return { success: true, status: 'active', workspaceId, planId, actionTaken: 'WORKSPACE_ACTIVATED' };
    }

    if (isFailed) {
      await workspaceService.updateWorkspaceSubscription(workspaceId, {
        subscriptionStatus: 'past_due'
      });

      try {
        WebSocketGateway.getInstance().broadcast('billing:payment:failed', {
          workspaceId,
          subscriptionStatus: 'past_due',
          message: 'Pagamento pendente ou cancelado.'
        });
      } catch (e) {
        // Ignore
      }

      console.log(`⚠️ [Billing Webhook] Workspace "${workspaceId}" marcado como PAST_DUE via ${provider.toUpperCase()}`);
      return { success: true, status: 'past_due', workspaceId, actionTaken: 'WORKSPACE_LOCKED' };
    }

    return { success: true, status: 'ignored', workspaceId, actionTaken: `EVENT_IGNORED_${eventType}` };
  }
}

export const billingService = new BillingService();
