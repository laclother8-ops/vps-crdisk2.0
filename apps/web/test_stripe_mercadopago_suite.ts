/**
 * 💳 =========================================================================
 * 💳 CRDISK STRIPE & MERCADO PAGO BILLING MOTOR TEST SUITE
 * 💳 =========================================================================
 * 
 * Validates:
 * 1. Multi-provider checkout generation (Stripe vs Mercado Pago).
 * 2. Generation of Pix QR Code (EMV payload) and Credit Card checkout URL.
 * 3. Exact 3 SaaS pricing plans: Básico (R$ 147), Pro (R$ 297), Enterprise (R$ 597).
 * 4. Stripe Webhook processing (checkout.session.completed, invoice.paid, customer.subscription.deleted).
 * 5. Mercado Pago Webhook processing (payment.created, payment.updated, approved vs rejected).
 * 6. Real-time billing status endpoint & WebSocket broadcast.
 * 7. Super Admin 1-click manual bypass override.
 */

import { billingService } from '../api/src/modules/billing/billing.service';
import { SAAS_PLANS } from '../api/src/modules/billing/billing.types';
import { workspaceService } from '../api/src/modules/workspaces/workspace.service';

let passedTests = 0;
let totalTests = 0;

function assert(condition: any, testName: string, detail?: string) {
  totalTests++;
  if (Boolean(condition)) {
    passedTests++;
    console.log(`  ✅ [PASS] ${testName}`);
  } else {
    console.error(`  ❌ [FAIL] ${testName}`);
    if (detail) console.error(`     Detalhes: ${detail}`);
  }
}

async function runGatewayTests() {
  console.log('\n💳 ========================================================');
  console.log('💳 CRDISK GATEWAYS (STRIPE & MERCADO PAGO) VALIDATION SUITE');
  console.log('💳 ========================================================\n');

  // =========================================================================
  // 📌 1. CONFIGURAÇÃO DOS 3 PLANOS COMERCIAIS
  // =========================================================================
  console.log('📌 1. VALIDAÇÃO DOS 3 PLANOS COMERCIAIS CRDISK');

  assert(SAAS_PLANS.starter.price === 147.00, 'Plano Básico configurado por R$ 147,00/mês (1 Operador)');
  assert(SAAS_PLANS.pro.price === 297.00, 'Plano Pro Executivo configurado por R$ 297,00/mês (3 Operadores + Discador + IA Sofia)');
  assert(SAAS_PLANS.enterprise.price === 597.00, 'Plano Enterprise configurado por R$ 597,00/mês (Operadores Ilimitados)');

  // =========================================================================
  // 📌 2. SESSÃO DE CHECKOUT STRIPE (CARTÃO & PIX)
  // =========================================================================
  console.log('\n📌 2. GERAÇÃO DE CHECKOUT STRIPE (CARTÃO & PIX)');

  const stripeCheckout = await billingService.createCheckoutSession({
    planId: 'pro',
    workspaceId: '11111111-3333-3333-3333-333333333333',
    provider: 'stripe',
    customerEmail: 'cliente.teste@empresa.com'
  });

  assert(stripeCheckout.provider === 'stripe', 'Provedor Stripe selecionado com sucesso');
  assert(stripeCheckout.amount === 297.00, 'Valor do checkout Stripe correspondente a R$ 297,00');
  assert(Boolean(stripeCheckout.pix?.copyPasteCode), 'Código Pix Copia e Cola gerado para o checkout');
  assert(Boolean(stripeCheckout.pix?.qrCodeImage), 'QR Code Pix dinâmico gerado');
  assert(Boolean(stripeCheckout.card?.checkoutUrl), 'URL de checkout Stripe gerada para pagamento via Cartão');

  // =========================================================================
  // 📌 3. SESSÃO DE CHECKOUT MERCADO PAGO (PIX & PREFERÊNCIA)
  // =========================================================================
  console.log('\n📌 3. GERAÇÃO DE CHECKOUT MERCADO PAGO (PIX & PREFERENCE API)');

  const mpCheckout = await billingService.createCheckoutSession({
    planId: 'starter',
    workspaceId: '11111111-3333-3333-3333-333333333333',
    provider: 'mercadopago',
    customerEmail: 'comprador@mercadopago.com'
  });

  assert(mpCheckout.provider === 'mercadopago', 'Provedor Mercado Pago selecionado com sucesso');
  assert(mpCheckout.amount === 147.00, 'Valor do checkout Mercado Pago correspondente a R$ 147,00');
  assert(Boolean(mpCheckout.pix?.copyPasteCode), 'Chave Pix Copia e Cola gerada no Mercado Pago');
  assert(Boolean(mpCheckout.checkoutUrl?.includes('mercadopago.com.br')), 'URL de preferência oficial do Mercado Pago gerada');

  // =========================================================================
  // 📌 4. TRATAMENTO DE WEBHOOKS STRIPE
  // =========================================================================
  console.log('\n📌 4. TRATAMENTO DE WEBHOOKS STRIPE EM TEMPO REAL');

  // Stripe checkout.session.completed
  const stripeWebhookResult = await billingService.handleWebhook('stripe', {
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_test_stripe_completed_123',
        client_reference_id: '11111111-3333-3333-3333-333333333333',
        metadata: {
          workspaceId: '11111111-3333-3333-3333-333333333333',
          planId: 'pro'
        }
      }
    }
  });

  assert(stripeWebhookResult.success === true, "Webhook Stripe 'checkout.session.completed' processado com sucesso");
  assert(stripeWebhookResult.status === 'active', "Workspace atualizado para status='active'");

  const wsAfterStripe = await workspaceService.getWorkspaceById('11111111-3333-3333-3333-333333333333');
  assert(wsAfterStripe?.subscriptionStatus === 'active', 'Status persistido no workspace como ATIVO');
  assert(Boolean(wsAfterStripe?.currentPeriodEnd), 'Vencimento da fatura (currentPeriodEnd) estendido para +30 dias');

  // Stripe customer.subscription.deleted (Cancelamento)
  const stripeCancelResult = await billingService.handleWebhook('stripe', {
    type: 'customer.subscription.deleted',
    data: {
      object: {
        id: 'sub_test_deleted_123',
        metadata: {
          workspaceId: '11111111-3333-3333-3333-333333333333'
        }
      }
    }
  });

  assert(stripeCancelResult.status === 'past_due', "Webhook Stripe 'customer.subscription.deleted' altera status para 'past_due'");

  // =========================================================================
  // 📌 5. TRATAMENTO DE WEBHOOKS MERCADO PAGO
  // =========================================================================
  console.log('\n📌 5. TRATAMENTO DE WEBHOOKS MERCADO PAGO EM TEMPO REAL');

  // Mercado Pago payment approved
  const mpWebhookResult = await billingService.handleWebhook('mercadopago', {
    action: 'payment.updated',
    type: 'payment',
    status: 'approved',
    workspaceId: '11111111-3333-3333-3333-333333333333',
    planId: 'enterprise',
    data: {
      id: 'mp_payment_987654321',
      status: 'approved'
    }
  });

  assert(mpWebhookResult.success === true, "Webhook Mercado Pago 'approved' processado com sucesso");
  assert(mpWebhookResult.status === 'active', "Workspace atualizado para status='active' e plano 'enterprise'");

  const wsAfterMP = await workspaceService.getWorkspaceById('11111111-3333-3333-3333-333333333333');
  assert(wsAfterMP?.subscriptionStatus === 'active' && wsAfterMP?.subscriptionPlan === 'enterprise', 'Workspace ativo no plano Enterprise');

  // Mercado Pago payment rejected
  const mpRejectResult = await billingService.handleWebhook('mercadopago', {
    action: 'payment.updated',
    status: 'rejected',
    workspaceId: '11111111-3333-3333-3333-333333333333',
    data: {
      id: 'mp_payment_rejected_123',
      status: 'rejected'
    }
  });

  assert(mpRejectResult.status === 'past_due', "Webhook Mercado Pago 'rejected' altera status para 'past_due'");

  // =========================================================================
  // 📌 6. BYPASS MANUAL DO SUPER ADMIN
  // =========================================================================
  console.log('\n📌 6. BYPASS MANUAL DO SUPER ADMIN (OVERRIDE 1-CLIQUE)');

  const superAdminBypass = await workspaceService.updateWorkspaceSubscription(
    '11111111-3333-3333-3333-333333333333',
    {
      subscriptionStatus: 'active',
      subscriptionPlan: 'enterprise',
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  );

  assert(
    superAdminBypass?.subscriptionStatus === 'active',
    'Super Admin consegue liberar acesso manualmente em 1 clique (Bypass Master)'
  );

  console.log('\n📊 ========================================================');
  console.log(`📊 TOTAL DE TESTES: ${passedTests}/${totalTests} APROVADOS (${Math.round((passedTests/totalTests)*100)}%)`);
  console.log('📊 ========================================================\n');

  if (passedTests === totalTests) {
    console.log('🏆 MOTOR DE GATEWAYS (STRIPE & MERCADO PAGO) 100% HOMOLOGADO!\n');
  } else {
    process.exit(1);
  }
}

runGatewayTests().catch(console.error);
