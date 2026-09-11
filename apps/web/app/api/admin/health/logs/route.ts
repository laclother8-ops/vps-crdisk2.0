import { NextResponse } from 'next/server';

export async function GET() {
  const now = new Date();
  const sampleLogs = [
    {
      id: 'log_01',
      timestamp: new Date(now.getTime() - 12000).toISOString(),
      category: 'WHATSAPP',
      level: 'INFO',
      message: 'Webhook payload received from Meta Graph API',
      meta: { event: 'messages.read', messageId: 'wamid.HBgL9824', latency: '42ms' }
    },
    {
      id: 'log_02',
      timestamp: new Date(now.getTime() - 8500).toISOString(),
      category: 'AI_RAG',
      level: 'INFO',
      message: 'Vector embedding similarity lookup completed',
      meta: { query: 'Planos e preços', score: 0.961, model: 'text-embedding-3-small' }
    },
    {
      id: 'log_03',
      timestamp: new Date(now.getTime() - 5200).toISOString(),
      category: 'BILLING',
      level: 'SUCCESS',
      message: 'Pix payment webhook captured & approved',
      meta: { transactionId: 'pix_9281a8b', amount: 'R$ 1,00', status: 'approved' }
    },
    {
      id: 'log_04',
      timestamp: new Date(now.getTime() - 1800).toISOString(),
      category: 'TELEPHONY',
      level: 'INFO',
      message: 'WebRTC loopback audio session initialized with Opus codec',
      meta: { jitter: '1.2ms', packetLoss: '0%' }
    }
  ];

  return NextResponse.json({
    logs: sampleLogs,
    gatewayStatus: 'ONLINE_HEALTHY',
    connectedClients: 4,
    uptimeSeconds: 864200
  });
}
