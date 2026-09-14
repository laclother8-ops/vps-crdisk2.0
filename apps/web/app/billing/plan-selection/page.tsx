'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Lock, 
  ShieldCheck, 
  CheckCircle2, 
  Zap, 
  Sparkles, 
  CreditCard, 
  QrCode, 
  PhoneCall, 
  Bot, 
  Users, 
  Headphones, 
  ArrowRight, 
  RefreshCw, 
  LogOut, 
  MessageSquare, 
  Copy, 
  Check, 
  AlertTriangle,
  Flame,
  Globe
} from 'lucide-react';
import { connectWebSocket } from '../../../lib/websocket';

interface PlanOption {
  id: 'starter' | 'pro' | 'enterprise';
  name: string;
  badge?: string;
  price: number;
  period: string;
  operators: string;
  dialer: string;
  ai: string;
  description: string;
  features: string[];
  popular?: boolean;
}

const SAAS_PLANS: PlanOption[] = [
  {
    id: 'starter',
    name: 'Básico',
    price: 147,
    period: '/mês',
    operators: '1 Operador',
    dialer: 'WebRTC Básico',
    ai: 'Suporte Padrão',
    description: 'Para corretores individuais e operações enxutas de vendas.',
    features: [
      '1 Operador dedicado',
      'Funil de Vendas Visual (Kanban)',
      'WhatsApp Live Integrado',
      'Gestão de Leads e Contatos',
      'Histórico de Atendimento Unificado'
    ]
  },
  {
    id: 'pro',
    name: 'Pro Executivo',
    badge: 'MAIS ESCOLHIDO',
    price: 297,
    period: '/mês',
    operators: '3 Operadores',
    dialer: 'Power Dialer Automático',
    ai: 'Sofia IA 24/7 Ativa',
    description: 'Potência máxima para equipes comerciais com discagem automática e IA.',
    popular: true,
    features: [
      'Até 3 Operadores simultâneos',
      'Discador Power Dialer com Fila Automática',
      'Assistente Virtual de Vendas (Sofia IA 24/7)',
      'WhatsApp Cloud API Oficial Multicanal',
      'Transcrição de Áudio Whisper & RAG',
      'Tabulação Rápida Pós-Atendimento'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    badge: 'ESCALA TOTAL',
    price: 597,
    period: '/mês',
    operators: 'Ilimitados',
    dialer: 'Telefonia WebRTC Avançada',
    ai: 'Múltiplos Agentes IA',
    description: 'Estrutura completa para grandes imobiliárias e operações de alta escala.',
    features: [
      'Operadores e Atendentes Ilimitados',
      'Telefonia WebRTC Avançada & Tronco SIP Dedicado',
      'Múltiplos Agentes de IA Customizados',
      'Base de Conhecimento RAG de Alta Capacidade',
      'Suporte Executivo Prioritário & SLA 99.9%',
      'Consultoria e Onboarding Dedicado'
    ]
  }
];

export default function PlanSelectionPage() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'pro' | 'enterprise'>('pro');
  const [paymentProvider, setPaymentProvider] = useState<'stripe' | 'mercadopago'>('stripe');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix');
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [pixData, setPixData] = useState<{ copyPasteCode: string; qrCodeImage: string; txId: string } | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string>('');
  const [workspaceInfo, setWorkspaceInfo] = useState<any>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [isSimulatingPayment, setIsSimulatingPayment] = useState(false);

  useEffect(() => {
    fetchSessionAndStatus();
    generateCheckout('pro', 'stripe');

    // 1. Real-time WebSocket connection for instant unlock
    const ws = connectWebSocket();
    const unsubscribe = ws.on('billing:payment:approved', () => {
      console.log('⚡ [Real-time] Payment approved via WebSocket broadcast!');
      handleUnlocked();
    });

    // 2. Lightweight Polling every 3 seconds
    const interval = setInterval(() => {
      checkSubscriptionStatus(false);
    }, 3000);

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  const fetchSessionAndStatus = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setWorkspaceInfo(data.workspace);
        if (data.workspace?.subscriptionStatus === 'active') {
          handleUnlocked();
        }
      }
    } catch (e) {
      console.warn('Erro ao carregar sessão:', e);
    }
  };

  const checkSubscriptionStatus = async (showFeedback = true) => {
    if (showFeedback) setIsCheckingStatus(true);
    try {
      const res = await fetch('/api/billing/status', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.isUnlocked || data.subscriptionStatus === 'active') {
          handleUnlocked();
        }
      }
    } catch (e) {
      // Ignore
    } finally {
      if (showFeedback) {
        setTimeout(() => setIsCheckingStatus(false), 500);
      }
    }
  };

  const handleUnlocked = () => {
    setPaymentSuccess(true);
    setTimeout(() => {
      router.push('/crm');
      router.refresh();
    }, 1200);
  };

  const generateCheckout = async (plan: 'starter' | 'pro' | 'enterprise', provider: 'stripe' | 'mercadopago') => {
    setIsCheckoutLoading(true);
    try {
      const res = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          planId: plan, 
          provider,
          paymentMethod: 'all',
          workspaceId: workspaceInfo?.id 
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.checkout?.pix) {
          setPixData(data.checkout.pix);
        }
        if (data.checkout?.checkoutUrl) {
          setCheckoutUrl(data.checkout.checkoutUrl);
        }
      }
    } catch (e) {
      console.error('Erro no checkout:', e);
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  const handleSelectPlan = (plan: 'starter' | 'pro' | 'enterprise') => {
    setSelectedPlan(plan);
    generateCheckout(plan, paymentProvider);
  };

  const handleChangeProvider = (provider: 'stripe' | 'mercadopago') => {
    setPaymentProvider(provider);
    generateCheckout(selectedPlan, provider);
  };

  const handleCopyPix = () => {
    if (pixData?.copyPasteCode) {
      navigator.clipboard.writeText(pixData.copyPasteCode);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  const handleSimulatePaymentWebhook = async () => {
    setIsSimulatingPayment(true);
    try {
      const res = await fetch('/api/webhooks/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'checkout.session.completed',
          event: 'payment.succeeded',
          provider: paymentProvider,
          workspaceId: workspaceInfo?.id || '11111111-3333-3333-3333-333333333333',
          planId: selectedPlan,
          amount: SAAS_PLANS.find(p => p.id === selectedPlan)?.price
        })
      });

      if (res.ok) {
        await checkSubscriptionStatus(true);
      }
    } catch (e) {
      console.error('Erro na simulação do webhook:', e);
    } finally {
      setIsSimulatingPayment(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      // Ignore
    }
    router.push('/login');
  };

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-[#070908] flex items-center justify-center p-6">
        <div className="bg-[#111513] border border-[#57EF40] rounded-3xl p-10 max-w-md w-full text-center shadow-[0_0_60px_rgba(87,239,64,0.3)] animate-in zoom-in-95 space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-[#57EF40]/20 border border-[#57EF40] flex items-center justify-center mx-auto text-[#57EF40] shadow-[0_0_30px_#57EF40]">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#57EF40] font-bold">
              PAGAMENTO APROVADO EM TEMPO REAL
            </span>
            <h2 className="text-2xl font-black text-white">Central Comercial Liberada!</h2>
            <p className="text-xs text-gray-300">
              Sua assinatura do plano <span className="text-[#57EF40] font-bold uppercase">{selectedPlan}</span> foi confirmada. Acessando o CRM...
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs font-mono text-[#57EF40]">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Redirecionando automaticamente...</span>
          </div>
        </div>
      </div>
    );
  }

  const currentPlanObj = SAAS_PLANS.find(p => p.id === selectedPlan) || SAAS_PLANS[1];

  return (
    <div className="min-h-screen bg-[#070908] text-white p-4 sm:p-8 flex flex-col justify-between">
      {/* Header Bar */}
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between pb-6 border-b border-[#222924]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#111513] border border-[#222924] flex items-center justify-center font-black text-sm text-[#57EF40]">
            CR
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm tracking-wide text-white">CRDISK</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#18201C] text-gray-400 border border-[#222924]">
                Assinatura SaaS
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {workspaceInfo?.name || 'Workspace Comercial'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => checkSubscriptionStatus(true)}
            disabled={isCheckingStatus}
            className="px-3.5 py-2 rounded-xl bg-[#111513] hover:bg-[#18201C] text-xs font-semibold text-gray-300 border border-[#222924] flex items-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#57EF40] ${isCheckingStatus ? 'animate-spin' : ''}`} />
            <span>Verificar Pagamento</span>
          </button>

          <button
            onClick={handleLogout}
            className="px-3.5 py-2 rounded-xl bg-[#18201C] hover:bg-red-950/40 text-xs font-semibold text-gray-400 hover:text-red-400 border border-[#222924] hover:border-red-900/40 flex items-center gap-1.5 transition-all cursor-pointer"
            title="Sair da Conta"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sair / Trocar Conta</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto w-full py-8 space-y-8">
        {/* Hero Title & Description */}
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold bg-[#57EF40]/10 text-[#57EF40] border border-[#57EF40]/30 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            Planos Comerciais de Alta Conversão
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Escolha o Plano Ideal para Sua Equipe
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Tenha acesso instantâneo ao CRM Kanban, Discador Automático WebRTC e Assistente Virtual de Vendas com liberação imediata via Pix ou Cartão.
          </p>
        </div>

        {/* 3 Plans Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {SAAS_PLANS.map((plan) => {
            const isSelected = selectedPlan === plan.id;
            return (
              <div
                key={plan.id}
                onClick={() => handleSelectPlan(plan.id)}
                className={`p-6 rounded-3xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#111513] border-[#57EF40] shadow-[0_0_35px_rgba(87,239,64,0.18)] ring-1 ring-[#57EF40]/40'
                    : 'bg-[#111513]/70 border-[#222924] hover:border-[#333E37] hover:bg-[#111513]'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 right-6 px-3 py-1 rounded-full bg-[#57EF40] text-[#070908] text-[10px] font-black tracking-wider uppercase shadow-[0_0_15px_#57EF40] flex items-center gap-1">
                    <Flame className="w-3 h-3 fill-current" />
                    <span>{plan.badge}</span>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-extrabold text-xl text-white">{plan.name}</h3>
                      <span className="text-[11px] font-semibold text-muted-foreground">{plan.operators}</span>
                    </div>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      isSelected ? 'border-[#57EF40] bg-[#57EF40] text-[#070908]' : 'border-[#222924]'
                    }`}>
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {plan.description}
                  </p>

                  <div className="flex items-baseline gap-1 pt-2">
                    <span className="text-xs text-muted-foreground">R$</span>
                    <span className="text-4xl font-black text-white font-mono">{plan.price}</span>
                    <span className="text-xs text-muted-foreground">{plan.period}</span>
                  </div>

                  <div className="pt-4 border-t border-[#222924] space-y-2.5">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      Recursos Inclusos:
                    </span>
                    <ul className="space-y-2">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="text-xs text-gray-300 flex items-start gap-2">
                          <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isSelected ? 'text-[#57EF40]' : 'text-emerald-500/70'}`} />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-[#222924]">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectPlan(plan.id);
                    }}
                    className={`w-full py-3.5 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all ${
                      isSelected
                        ? 'bg-[#57EF40] text-[#070908] shadow-[0_0_20px_rgba(87,239,64,0.3)] hover:brightness-110 active:scale-95'
                        : 'bg-[#18201C] text-gray-300 border border-[#222924] hover:border-[#333E37] hover:text-white'
                    }`}
                  >
                    <span>{isSelected ? 'Assinar Este Plano' : 'Selecionar Plano'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Checkout Box */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#111513] border border-[#222924] shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#222924]">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#57EF40]">Etapa Final</span>
              <h3 className="font-extrabold text-base text-white mt-0.5">
                Checkout Seguro & Confirmação Automática
              </h3>
            </div>

            {/* Provider & Method Switcher */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Provider Selector */}
              <div className="flex items-center gap-1 bg-[#18201C] p-1 rounded-2xl border border-[#222924]">
                <button
                  onClick={() => handleChangeProvider('stripe')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    paymentProvider === 'stripe'
                      ? 'bg-[#57EF40] text-[#070908]'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Stripe
                </button>
                <button
                  onClick={() => handleChangeProvider('mercadopago')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    paymentProvider === 'mercadopago'
                      ? 'bg-[#57EF40] text-[#070908]'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Mercado Pago
                </button>
              </div>

              {/* Payment Method Selector */}
              <div className="flex items-center gap-1 bg-[#18201C] p-1 rounded-2xl border border-[#222924]">
                <button
                  onClick={() => setPaymentMethod('pix')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    paymentMethod === 'pix'
                      ? 'bg-[#57EF40] text-[#070908]'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Pix</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    paymentMethod === 'card'
                      ? 'bg-[#57EF40] text-[#070908]'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Cartão</span>
                </button>
              </div>
            </div>
          </div>

          {paymentMethod === 'pix' ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              {/* QR Code */}
              <div className="md:col-span-4 flex flex-col items-center justify-center p-6 rounded-2xl bg-[#18201C] border border-[#222924] text-center space-y-3">
                <div className="p-3 bg-white rounded-2xl shadow-inner">
                  {pixData?.qrCodeImage ? (
                    <img 
                      src={pixData.qrCodeImage} 
                      alt="QR Code Pix" 
                      className="w-44 h-44 object-contain rounded-lg"
                    />
                  ) : (
                    <div className="w-44 h-44 flex items-center justify-center bg-gray-100 text-gray-400 text-xs">
                      Gerando QR Code...
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ShieldCheck className="w-4 h-4 text-[#57EF40]" />
                  <span>Pix Banco Central do Brasil • Instantâneo</span>
                </div>
              </div>

              {/* Code & Auto-confirmation */}
              <div className="md:col-span-8 space-y-4">
                <div className="p-4 rounded-2xl bg-[#18201C] border border-[#222924] space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Plano Contratado:</span>
                    <span className="text-white font-bold">{currentPlanObj.name} ({paymentProvider.toUpperCase()})</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Valor da Mensalidade:</span>
                    <span className="text-[#57EF40] font-mono font-bold text-base">
                      R$ {currentPlanObj.price.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300">
                    Chave Pix Copia e Cola:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={pixData?.copyPasteCode || 'Carregando código Pix...'}
                      className="w-full bg-[#18201C] border border-[#222924] rounded-xl px-3.5 py-2.5 text-xs font-mono text-gray-300 outline-none select-all"
                    />
                    <button
                      onClick={handleCopyPix}
                      className="px-4 py-2.5 rounded-xl bg-[#57EF40] hover:bg-[#65C556] text-[#070908] font-bold text-xs flex items-center gap-1.5 transition-all shrink-0 active:scale-95"
                    >
                      {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{isCopied ? 'Copiado!' : 'Copiar'}</span>
                    </button>
                  </div>
                </div>

                {/* Status Indicator & Instant Webhook Simulation */}
                <div className="p-4 rounded-2xl bg-[#18201C] border border-[#222924] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-[#57EF40] animate-ping" />
                    <div className="text-xs">
                      <span className="font-bold text-white block">Aguardando confirmação do Pix...</span>
                      <span className="text-[11px] text-muted-foreground">Assim que pagar no app do banco, sua tela é liberada na hora.</span>
                    </div>
                  </div>

                  <button
                    onClick={handleSimulatePaymentWebhook}
                    disabled={isSimulatingPayment}
                    className="px-4 py-2 rounded-xl bg-[#111513] hover:bg-[#202B25] text-[#57EF40] text-xs font-bold border border-[#57EF40]/40 flex items-center gap-1.5 transition-all shrink-0"
                    title="Simular Webhook de Confirmação Imediata"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>{isSimulatingPayment ? 'Confirmando...' : 'Confirmar Pix (Simulação)'}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-md mx-auto p-6 rounded-2xl bg-[#18201C] border border-[#222924] space-y-4 text-center">
              <CreditCard className="w-10 h-10 text-[#57EF40] mx-auto" />
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-white">Checkout Seguro ({paymentProvider.toUpperCase()})</h4>
                <p className="text-xs text-muted-foreground">
                  Você será redirecionado para a página criptografada de pagamento do {paymentProvider === 'stripe' ? 'Stripe' : 'Mercado Pago'} para registrar seu cartão corporativo.
                </p>
              </div>

              <a
                href={checkoutUrl || `https://checkout.stripe.com/pay/cs_test_demo?plan=${selectedPlan}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 rounded-xl bg-[#57EF40] text-[#070908] font-bold text-xs flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-glow-green"
              >
                <span>Ir para Checkout Seguro</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>

              <div className="pt-2">
                <button
                  onClick={handleSimulatePaymentWebhook}
                  disabled={isSimulatingPayment}
                  className="text-[11px] text-gray-400 hover:text-[#57EF40] underline"
                >
                  Simular aprovação imediata do cartão
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-7xl mx-auto w-full pt-6 border-t border-[#222924] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>CRDISK SaaS Platform</span>
          <span>•</span>
          <span>Criptografia SSL & Gateways PCI-DSS Compliance</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="mailto:financeiro@crdisk.com.br" className="hover:text-white transition-colors">
            Falar com Suporte Financeiro
          </a>
        </div>
      </div>
    </div>
  );
}
