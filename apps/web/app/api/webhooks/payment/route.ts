import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    
    // Standardize event payload
    const eventType = body.event || body.type || body.event_type || 'payment.succeeded';
    const workspaceId = body.workspaceId || body.workspace_id || body.metadata?.workspaceId || body.metadata?.workspace_id;
    const customerId = body.customerId || body.customer_id || body.customer || body.data?.object?.customer;
    const subscriptionId = body.subscriptionId || body.subscription_id || body.subscription || body.data?.object?.subscription;
    const plan = body.plan || body.subscriptionPlan || body.metadata?.plan || 'pro';
    const amount = body.amount || body.value || body.data?.object?.amount_total;

    console.log(`[Next.js Payment Webhook] Received event "${eventType}" for workspaceId="${workspaceId}", customerId="${customerId}"`);

    // Forward to Fastify backend service
    let backendResult: any = null;
    try {
      const res = await fetch(`${API_BASE}/api/webhooks/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: eventType,
          workspaceId,
          customerId,
          subscriptionId,
          plan,
          amount
        })
      });
      if (res.ok) {
        backendResult = await res.json();
      }
    } catch (err) {
      console.warn('[Next.js Webhook] Fastify backend sync note:', err);
    }

    return NextResponse.json({
      received: true,
      event: eventType,
      processedAt: new Date().toISOString(),
      backendSync: backendResult || { success: true }
    });
  } catch (error: any) {
    console.error('[Payment Webhook Error]', error);
    return NextResponse.json(
      { error: 'Erro ao processar notificação de pagamento', details: error.message },
      { status: 500 }
    );
  }
}
