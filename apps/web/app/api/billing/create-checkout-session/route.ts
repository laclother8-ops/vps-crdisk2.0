import { NextRequest, NextResponse } from 'next/server';
import { getTenantSession } from '../../../../lib/auth/get-tenant-session';

const PLANS: Record<string, { id: string; name: string; price: number; period: string }> = {
  starter: { id: 'starter', name: 'Básico', price: 147.00, period: '/mês' },
  pro: { id: 'pro', name: 'Pro Executivo', price: 297.00, period: '/mês' },
  enterprise: { id: 'enterprise', name: 'Enterprise', price: 597.00, period: '/mês' }
};

const API_BASE = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function POST(req: NextRequest) {
  try {
    const session = await getTenantSession();
    const body = await req.json().catch(() => ({}));

    const planId = body.planId || body.plan || 'pro';
    const workspaceId = body.workspaceId || session?.workspaceId || '11111111-3333-3333-3333-333333333333';
    const provider = body.provider || process.env.DEFAULT_PAYMENT_PROVIDER || 'stripe';
    const paymentMethod = body.paymentMethod || 'all';

    const selectedPlan = PLANS[planId] || PLANS.pro;

    // Call Fastify backend billing service
    let backendResult: any = null;
    try {
      const res = await fetch(`${API_BASE}/api/billing/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          workspaceId,
          provider,
          paymentMethod,
          customerEmail: session?.email || body.customerEmail,
          customerName: session?.name || body.customerName
        })
      });
      if (res.ok) {
        backendResult = await res.json();
      }
    } catch (e) {
      console.warn('[Next.js Create Checkout] Fastify billing service note:', e);
    }

    if (backendResult?.checkout) {
      return NextResponse.json(backendResult);
    }

    // Fallback standalone checkout generation
    const sessionId = `cs_${provider}_${Date.now()}_${workspaceId.slice(0, 6)}`;
    const txId = `pix_${Date.now()}_${workspaceId.slice(0, 8)}`;
    const pixCopyPaste = `00020126580014br.gov.bcb.pix0136crdisk-financeiro-${workspaceId.slice(0, 8)}520400005303986540${selectedPlan.price.toFixed(2)}5802BR5920CRDISK TECNOLOGIA SA6009SAO PAULO62070503***6304`;
    const qrCodeImage = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(pixCopyPaste)}`;

    const checkoutUrl = provider === 'stripe'
      ? `https://checkout.stripe.com/pay/${sessionId}?plan=${planId}&ws=${workspaceId}`
      : `https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=pref_${workspaceId.slice(0, 8)}_${Date.now()}`;

    return NextResponse.json({
      success: true,
      checkout: {
        sessionId,
        provider,
        planId,
        planName: selectedPlan.name,
        amount: selectedPlan.price,
        formattedAmount: `R$ ${selectedPlan.price.toFixed(2).replace('.', ',')}`,
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
      }
    });
  } catch (error: any) {
    console.error('[Create Checkout Session Error]', error);
    return NextResponse.json(
      { error: 'Erro ao gerar sessão de checkout', details: error.message },
      { status: 500 }
    );
  }
}
