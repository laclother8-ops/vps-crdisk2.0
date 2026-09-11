import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const amount = body.amount || 1.00;
    const provider = body.provider || 'mercadopago';

    const transactionId = `pixtest_${Math.random().toString(36).substring(2, 12)}_${Date.now()}`;
    const emvCopiaECola = `00020126580014br.gov.bcb.pix0136${Math.random().toString(36).substring(2, 18)}520400005303986540${amount.toFixed(2)}5802BR5916CRDISK TEC SAAS6009SAO PAULO62070503***6304E8F2`;

    // High quality QR Code SVG data URL
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(emvCopiaECola)}`;

    return NextResponse.json({
      success: true,
      transactionId,
      provider: provider === 'stripe' ? 'Stripe Checkout / Billing v2' : 'Mercado Pago Pix v2 API',
      amount,
      currency: 'BRL',
      status: 'pending',
      emvCopiaECola,
      qrCodeUrl,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      webhookListener: {
        channel: `billing:payment:${transactionId}`,
        expectedEvent: 'payment.approved',
        workspaceUnlocked: 'ws_homologation_demo'
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        statusCode: 500,
        error: error.message || 'Falha na emissão do Pix de teste'
      },
      { status: 500 }
    );
  }
}
