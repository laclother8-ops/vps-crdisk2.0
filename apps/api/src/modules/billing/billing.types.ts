export type PaymentProvider = 'stripe' | 'mercadopago';

export interface PlanConfig {
  id: 'starter' | 'pro' | 'enterprise';
  name: string;
  badge?: string;
  price: number;
  period: string;
  operators: number;
  minutes: number;
  description: string;
  features: string[];
  popular?: boolean;
}

export const SAAS_PLANS: Record<'starter' | 'pro' | 'enterprise', PlanConfig> = {
  starter: {
    id: 'starter',
    name: 'Básico',
    price: 147.00,
    period: 'mês',
    operators: 1,
    minutes: 300,
    description: 'Ideal para corretores individuais e operações enxutas de vendas.',
    features: [
      '1 Operador dedicado',
      'Funil de Vendas Visual (Kanban)',
      'WhatsApp Live Integrado',
      'Gestão Centralizada de Contatos e Leads',
      'Relatórios Básicos de Fechamento'
    ]
  },
  pro: {
    id: 'pro',
    name: 'Pro Executivo',
    badge: 'MAIS ESCOLHIDO',
    price: 297.00,
    period: 'mês',
    operators: 3,
    minutes: 1500,
    description: 'Potência máxima para equipes comerciais com discagem automática e IA.',
    popular: true,
    features: [
      'Até 3 Operadores simultâneos',
      'Fila Automática de Discagem (Power Dialer)',
      'Assistente Virtual de Vendas (Sofia IA 24/7)',
      'WhatsApp Cloud API Oficial Multicanal',
      'Transcrição de Áudio Whisper & RAG',
      'Tabulação Rápida Pós-Atendimento'
    ]
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    badge: 'ESCALA TOTAL',
    price: 597.00,
    period: 'mês',
    operators: 999,
    minutes: 99999,
    description: 'Estrutura completa para grandes imobiliárias e operações de alta escala.',
    features: [
      'Operadores e Atendentes Ilimitados',
      'Telefonia WebRTC Avançada & Tronco SIP Dedicado',
      'Múltiplos Agentes de IA Especializados',
      'Base de Conhecimento RAG de Alta Capacidade',
      'Suporte Prioritário Executivo & SLA 99.9%',
      'Onboarding & Consultoria de Implantação'
    ]
  }
};

export interface CreateCheckoutInput {
  planId: 'starter' | 'pro' | 'enterprise';
  workspaceId: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  paymentMethod?: 'pix' | 'card' | 'all';
  provider?: PaymentProvider;
}

export interface CheckoutSessionResult {
  sessionId: string;
  provider: PaymentProvider;
  planId: string;
  planName: string;
  amount: number;
  formattedAmount: string;
  workspaceId: string;
  checkoutUrl?: string;
  pix?: {
    txId: string;
    copyPasteCode: string;
    qrCodeBase64?: string;
    qrCodeImage?: string;
    expiresAt: string;
  };
  card?: {
    stripeClientSecret?: string;
    checkoutUrl: string;
  };
  status: 'pending' | 'approved';
}
