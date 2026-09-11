import { NextRequest, NextResponse } from 'next/server';
import { getTenantSession } from '../../../../lib/auth/get-tenant-session';

const PLANS_CATALOG: Record<string, { name: string; price: number; interval: string; operators: number; minutes: number }> = {
  starter: {
    name: 'CRDISK Starter',
    price: 197.00,
    interval: 'mês',
    operators: 2,
    minutes: 300
  },
  pro: {
    name: 'CRDISK Pro',
    price: 497.00,
    interval: 'mês',
    operators: 10,
    minutes: 1500
  },
  enterprise: {
    name: 'CRDISK Enterprise',
    price: 1290.00,
    interval: 'mês',
    operators: 999,
    minutes: 99999
  }
};

export async function POST(req: NextRequest) {
  try {
    const session = await getTenantSession();
    const body = await req.json().catch(() => ({}));
    const { plan = 'pro', paymentMethod = 'PIX' } = body;

    const selectedPlan = PLANS_CATALOG[plan] || PLANS_CATALOG.pro;
    const workspaceId = session?.workspaceId || '11111111-3333-3333-3333-333333333333';
    const clientEmail = session?.email || 'cliente@empresa.com.br';

    // Generate PIX QR Code & Copia e Cola or Stripe Checkout Session link
    const simulatedTxId = `pix_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const pixCopyPaste = `00020126580014br.gov.bcb.pix0136crdisk-financeiro-${workspaceId.slice(0, 8)}520400005303986540${selectedPlan.price.toFixed(2)}5802BR5920CRDISK TECNOLOGIA SA6009SAO PAULO62070503***6304`;

    return NextResponse.json({
      success: true,
      checkoutSession: {
        id: `cs_${Date.now()}`,
        plan: plan,
        planName: selectedPlan.name,
        amount: selectedPlan.price,
        formattedAmount: `R$ ${selectedPlan.price.toFixed(2).replace('.', ',')}`,
        paymentMethod,
        currency: 'BRL',
        workspaceId,
        customerEmail: clientEmail,
        pix: {
          txId: simulatedTxId,
          copyPasteCode: pixCopyPaste,
          qrCodeImage: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(pixCopyPaste)}`,
          expiresInMinutes: 30
        },
        stripeCheckoutUrl: `https://checkout.stripe.com/pay/cs_test_${workspaceId.slice(0, 8)}?plan=${plan}`,
        message: 'Checkout gerado com sucesso. Efetue o pagamento para ativação imediata.'
      }
    });
  } catch (error: any) {
    console.error('[Billing Checkout Error]', error);
    return NextResponse.json(
      { error: 'Erro ao gerar checkout de assinatura', details: error.message },
      { status: 500 }
    );
  }
}
