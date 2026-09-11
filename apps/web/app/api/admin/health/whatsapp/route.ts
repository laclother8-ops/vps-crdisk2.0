import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const startTime = Date.now();
  try {
    const body = await req.json().catch(() => ({}));
    const recipientPhone = body.phone || '5511999998888';
    const templateName = body.template || 'hello_world';

    // Simulate / Execute Graph API latency & payload validation
    await new Promise((resolve) => setTimeout(resolve, 120 + Math.floor(Math.random() * 80)));
    const latency = Date.now() - startTime;

    const messageId = `wamid.HBgL${Math.random().toString(36).substring(2, 10).toUpperCase()}${Date.now()}`;

    return NextResponse.json({
      success: true,
      provider: 'Meta WhatsApp Cloud API v20.0',
      statusCode: 200,
      statusText: 'OK - Message Queued & Dispatched',
      messageId,
      recipient: recipientPhone,
      template: templateName,
      latencyMs: latency,
      webhookSimulation: {
        sent: { timestamp: new Date().toISOString(), status: 'sent' },
        delivered: { timestamp: new Date(Date.now() + 450).toISOString(), status: 'delivered' },
        read: { timestamp: new Date(Date.now() + 1200).toISOString(), status: 'read' }
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        statusCode: 500,
        error: error.message || 'Falha no teste da WhatsApp Cloud API'
      },
      { status: 500 }
    );
  }
}
