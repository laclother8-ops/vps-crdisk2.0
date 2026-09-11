import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const stripeSig = req.headers.get('stripe-signature');
    const mpSig = req.headers.get('x-signature');
    const provider = body.provider || (stripeSig ? 'stripe' : (mpSig ? 'mercadopago' : (process.env.DEFAULT_PAYMENT_PROVIDER || 'stripe')));

    console.log(`[Next.js Billing Webhook] Received webhook for provider "${provider}"`);

    let backendResult: any = null;
    try {
      const res = await fetch(`${API_BASE}/api/webhooks/billing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...body,
          provider
        })
      });
      if (res.ok) {
        backendResult = await res.json();
      }
    } catch (e) {
      console.warn('[Next.js Webhook Forwarding Note]', e);
    }

    return NextResponse.json({
      received: true,
      provider,
      backendResult: backendResult || { success: true },
      processedAt: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('[Billing Webhook Error]', error);
    return NextResponse.json(
      { error: 'Erro ao processar notificação de faturamento' },
      { status: 500 }
    );
  }
}
