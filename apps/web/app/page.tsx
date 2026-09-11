'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  PhoneCall, 
  Bot, 
  Kanban, 
  Zap, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles, 
  MessageSquare, 
  Users, 
  Clock, 
  TrendingUp, 
  Headphones, 
  Radio, 
  Mic, 
  ChevronDown, 
  Layers, 
  Activity,
  Check,
  Play,
  Volume2
} from 'lucide-react';

export default function LandingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [activeTabDemo, setActiveTabDemo] = useState<'dialer' | 'sofia' | 'crm'>('dialer');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const plans = [
    {
      id: 'basic',
      name: 'Básico',
      slug: 'basic',
      description: 'Ideal para corretores e operadores individuais que precisam de funil ágil e WhatsApp integrado.',
      monthlyPrice: 147,
      annualPrice: 117,
      badge: null,
      highlight: false,
      features: [
        '1 Operador Dedicado',
        'Funil de Vendas Kanban Ilimitado',
        'WhatsApp Cloud API Integrado',
        'Histórico Completo de Mensagens',
        'Importação de Leads via CSV',
        'Suporte Técnico por Chamados'
      ],
      ctaText: 'Assinar Plano Básico'
    },
    {
      id: 'pro',
      name: 'Pro',
      slug: 'pro',
      description: 'Para equipes de alta performance que exigem discador automático e automação de IA Sofia.',
      monthlyPrice: 297,
      annualPrice: 237,
      badge: 'Mais Escolhido • Alta Conversão',
      highlight: true,
      features: [
        'Até 3 Operadores Inclusos',
        'Power Dialer WebRTC com 1-Click',
        'Agente Sofia IA com Base de Conhecimento',
        'Qualificação Receptiva no WhatsApp',
        'Gravação & Tabulação de Chamadas',
        'Relatórios de Conversão e Produtividade',
        'Suporte Prioritário Via WhatsApp'
      ],
      ctaText: 'Assinar Plano Pro'
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      slug: 'enterprise',
      description: 'Operações em escala que necessitam de telefonia avançada, múltiplos agentes e SLA garantido.',
      monthlyPrice: 597,
      annualPrice: 477,
      badge: 'Escala & Infraestrutura',
      highlight: false,
      features: [
        'Operadores & Filas Ilimitadas',
        'Telefonia WebRTC Avançada & Tronco SIP',
        'Múltiplos Agentes de IA Customizados',
        'Webhooks & API REST Dedicada',
        'SLA Contratual de 99.98% de Uptime',
        'Gerente de Contas & Onboarding Assistido',
        'Backups Contínuos & Auditoria LGPD'
      ],
      ctaText: 'Assinar Enterprise'
    }
  ];

  const faqs = [
    {
      q: 'Como funciona o Discador Automático WebRTC?',
      a: 'Nosso discador opera 100% diretamente pelo navegador, sem necessidade de instalar aplicativos externos ou softphones complexos. Com 1 clique no lead ou atalho de teclado, a chamada é disparada instantaneamente com áudio HD criptografado.'
    },
    {
      q: 'O que a Sofia IA faz no atendimento de WhatsApp?',
      a: 'A Sofia é nossa agente de IA autônoma treinada para qualificar leads, responder dúvidas com base nos documentos da sua empresa e agendar reuniões diretamente no funil CRM. Se uma ligação não for atendida, ela pode disparar uma régua ativa de WhatsApp automaticamente.'
    },
    {
      q: 'Posso migrar meus contatos e histórico do CRM atual?',
      a: 'Sim. A plataforma possui importador inteligente via CSV/Excel que mapeia campos personalizados, telefones com DDI/DDD e histórico de status em menos de 2 minutos.'
    },
    {
      q: 'Existe taxa de cancelamento ou contrato de fidelidade?',
      a: 'Zero fidelidade no plano mensal. Você pode cancelar ou alterar seu plano a qualquer momento diretamente pelo portal de faturamento sem multas ou burocracia.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#070908] text-[#F2F5F3] selection:bg-[#57EF40]/20 selection:text-[#57EF40] relative overflow-hidden font-sans">
      {/* Background Subtle Tech Grids & Radial Lights */}
      <div className="absolute inset-0 bg-tech-grid opacity-20 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-radial-gradient from-[#57EF40]/10 via-[#070908]/0 to-transparent blur-3xl pointer-events-none" />

      {/* ========================================================================= */}
      {/* 1. EXECUTIVE NAVBAR */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-50 w-full border-b border-[#1F2621] bg-[#070908]/85 backdrop-blur-md transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-[#111513] border border-[#26332B] flex items-center justify-center text-[#57EF40] shadow-glow-green-sm group-hover:border-[#57EF40]/60 transition-all">
              <Activity className="w-5 h-5 text-[#57EF40]" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                CRDISK <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-[#18201C] text-[#57EF40] border border-[#26332B]">2.0</span>
              </span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Comercial & Telefonia</span>
            </div>
          </Link>

          {/* Navigation Anchors */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-muted-foreground">
            <a href="#recursos" className="hover:text-[#57EF40] transition-colors">Recursos</a>
            <a href="#demonstracao" className="hover:text-[#57EF40] transition-colors">Demonstração</a>
            <a href="#planos" className="hover:text-[#57EF40] transition-colors">Planos & Preços</a>
            <a href="#roi" className="hover:text-[#57EF40] transition-colors">Resultados</a>
            <a href="#faq" className="hover:text-[#57EF40] transition-colors">FAQ</a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#F2F5F3] hover:text-white hover:bg-[#111513] border border-transparent hover:border-[#1F2621] transition-all"
            >
              Entrar
            </Link>
            <Link
              href="/register"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#57EF40] to-[#65C556] text-[#070908] text-xs font-extrabold shadow-glow-green hover:shadow-glow-green-lg active:scale-[0.98] transition-all flex items-center gap-1.5"
            >
              <span>Começar Agora</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. HERO SECTION */}
      {/* ========================================================================= */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          {/* Micro-badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#111513] border border-[#26332B] text-xs font-bold text-[#57EF40] shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#57EF40] animate-pulse" />
            <span>CRDISK 2.0 • Infraestrutura Comercial Unificada</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.12]">
            Seu funil, suas ligações e sua inteligência comercial <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#57EF40] to-[#65C556]">na mesma tela.</span>
          </h1>

          {/* Sub-headline */}
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Centralize CRM Kanban, telefonia ativa com discador automático WebRTC e atendimento inteligente no WhatsApp. Sem troca de abas, sem perda de contexto.
          </p>

          {/* Primary & Secondary CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/register?plan=pro&billing=monthly"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-[#57EF40] to-[#65C556] text-[#070908] text-sm font-black shadow-glow-green hover:shadow-glow-green-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <span>Experimentar Grátis por 7 Dias</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#demonstracao"
              className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-[#111513] hover:bg-[#18201C] text-[#F2F5F3] border border-[#26332B] hover:border-[#57EF40]/40 text-sm font-bold transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 text-[#57EF40]" />
              <span>Ver Demonstração Interativa</span>
            </a>
          </div>

          {/* Micro social proof under CTAs */}
          <div className="flex items-center justify-center gap-6 pt-2 text-[11px] text-muted-foreground/80">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-[#57EF40]" /> Setup em 3 minutos</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-[#57EF40]" /> Sem cartão para testar</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-[#57EF40]" /> Cancelamento em 1 clique</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* HERO TACTILE MOCKUP (Kanban + Softphone + Sofia Live) */}
        {/* ========================================================================= */}
        <div id="demonstracao" className="mt-14 relative rounded-3xl bg-[#111513] border border-[#1F2621] p-4 sm:p-6 shadow-2xl shadow-black/80 overflow-hidden">
          {/* Top Window Bar */}
          <div className="flex items-center justify-between pb-4 border-b border-[#1F2621]">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/30 border border-red-500/50" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/30 border border-yellow-500/50" />
              <div className="w-3 h-3 rounded-full bg-green-500/30 border border-green-500/50" />
              <span className="ml-3 text-[11px] font-mono text-muted-foreground">app.crdisk.com.br/crm</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#18201C] text-[#57EF40] text-[10px] font-bold border border-[#26332B]">
                <Radio className="w-3 h-3 text-[#57EF40] animate-pulse" />
                WebRTC Gateway Online
              </span>
            </div>
          </div>

          {/* Interactive Mockup Tabs */}
          <div className="flex items-center gap-2 pt-4 pb-4">
            <button
              onClick={() => setActiveTabDemo('dialer')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTabDemo === 'dialer'
                  ? 'bg-[#18201C] text-[#57EF40] border border-[#26332B] shadow-glow-green-sm'
                  : 'text-muted-foreground hover:text-white'
              }`}
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>1. Power Dialer Ativo</span>
            </button>
            <button
              onClick={() => setActiveTabDemo('sofia')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTabDemo === 'sofia'
                  ? 'bg-[#18201C] text-[#57EF40] border border-[#26332B] shadow-glow-green-sm'
                  : 'text-muted-foreground hover:text-white'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>2. Sofia IA (WhatsApp)</span>
            </button>
            <button
              onClick={() => setActiveTabDemo('crm')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTabDemo === 'crm'
                  ? 'bg-[#18201C] text-[#57EF40] border border-[#26332B] shadow-glow-green-sm'
                  : 'text-muted-foreground hover:text-white'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>3. Linha do Tempo CRM</span>
            </button>
          </div>

          {/* Main Mockup Viewport */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-2">
            {/* Left/Center: Kanban Columns */}
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Column 1: Novos Leads */}
              <div className="p-3.5 rounded-2xl bg-[#0c0f0d] border border-[#1F2621] space-y-3">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    Novos Contatos
                  </span>
                  <span className="text-[10px] text-muted-foreground bg-[#18201C] px-1.5 py-0.5 rounded">3</span>
                </div>
                {/* Lead Card 1 */}
                <div className="p-3 rounded-xl bg-[#111513] border border-[#1F2621] hover:border-[#57EF40]/30 transition-all space-y-2 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Dra. Camila Nogueira</span>
                    <span className="text-[10px] text-[#57EF40] font-mono font-bold">R$ 4.800</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Clínica Radiológica São Lucas</p>
                  <div className="flex items-center justify-between pt-1 border-t border-[#1F2621] text-[10px] text-muted-foreground">
                    <span>Origem: Google Ads</span>
                    <span className="text-[#57EF40] font-semibold">Qualificado</span>
                  </div>
                </div>

                {/* Lead Card 2 */}
                <div className="p-3 rounded-xl bg-[#111513] border border-[#1F2621] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Dr. Marcos Valério</span>
                    <span className="text-[10px] text-[#57EF40] font-mono font-bold">R$ 7.200</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Instituto Dental 3D</p>
                  <div className="flex items-center justify-between pt-1 border-t border-[#1F2621] text-[10px] text-muted-foreground">
                    <span>Origem: Indicação</span>
                    <span className="text-yellow-400 font-semibold">Aguardando Retorno</span>
                  </div>
                </div>
              </div>

              {/* Column 2: Em Negociação / Chamada */}
              <div className="p-3.5 rounded-2xl bg-[#0c0f0d] border border-[#26332B] space-y-3 relative">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#57EF40] animate-pulse" />
                    Ligação em Andamento
                  </span>
                  <span className="text-[10px] text-[#57EF40] bg-[#18201C] px-1.5 py-0.5 rounded font-bold">1 ATIVA</span>
                </div>

                {/* Active Call Card */}
                <div className="p-3.5 rounded-xl bg-[#18201C] border border-[#57EF40]/50 shadow-glow-green-sm space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-[#57EF40] text-[#070908] flex items-center justify-center font-bold text-[10px]">
                        <PhoneCall className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-white">Dr. Eduardo Silveira</span>
                    </div>
                    <span className="text-[10px] font-mono text-[#57EF40] font-bold">01:42</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Proposta Plano Enterprise - 5 Operadores</p>
                  
                  {/* Audio Wave Simulator */}
                  <div className="flex items-center gap-1 h-3 py-1">
                    <div className="w-1 bg-[#57EF40] rounded-full animate-bounce h-3" />
                    <div className="w-1 bg-[#57EF40] rounded-full animate-pulse h-2" />
                    <div className="w-1 bg-[#57EF40] rounded-full animate-bounce h-4" />
                    <div className="w-1 bg-[#57EF40] rounded-full animate-pulse h-2" />
                    <div className="w-1 bg-[#57EF40] rounded-full animate-bounce h-3" />
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-[#26332B] text-[10px]">
                    <span className="text-muted-foreground font-mono">Gravação ativa</span>
                    <span className="text-[#57EF40] font-bold">Tabulação 1-Click</span>
                  </div>
                </div>
              </div>

              {/* Column 3: Proposta Enviada */}
              <div className="p-3.5 rounded-2xl bg-[#0c0f0d] border border-[#1F2621] space-y-3">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-400" />
                    Fechamento / Pix
                  </span>
                  <span className="text-[10px] text-muted-foreground bg-[#18201C] px-1.5 py-0.5 rounded">2</span>
                </div>
                <div className="p-3 rounded-xl bg-[#111513] border border-[#1F2621] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Centro Tomografia Sul</span>
                    <span className="text-[10px] text-[#57EF40] font-mono font-bold">R$ 12.000</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Pix Gerado • Aguardando Compensação</p>
                  <div className="flex items-center justify-between pt-1 border-t border-[#1F2621] text-[10px] text-[#57EF40]">
                    <span>Sofia IA enviou lembrete</span>
                    <span className="font-bold">Hoje 10:45</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side: Interactive Softphone & Sofia Intelligence Widget */}
            <div className="lg:col-span-4 rounded-2xl bg-[#0c0f0d] border border-[#26332B] p-4 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#1F2621]">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <Bot className="w-4 h-4 text-[#57EF40]" />
                  <span>Sofia IA • Assistente Ativa</span>
                </div>
                <span className="text-[10px] text-[#57EF40] font-mono font-bold">RAG v2.4</span>
              </div>

              {/* Live Chat Snippet */}
              <div className="space-y-2.5 text-xs">
                <div className="p-2.5 rounded-xl bg-[#111513] border border-[#1F2621] space-y-1">
                  <span className="text-[10px] text-muted-foreground font-semibold">Cliente (Dr. Eduardo):</span>
                  <p className="text-white text-[11px]">"Como faço para integrar o discador ao meu número fixo atual?"</p>
                </div>
                <div className="p-2.5 rounded-xl bg-[#18201C] border border-[#26332B] text-[#57EF40] space-y-1">
                  <span className="text-[10px] text-[#57EF40]/80 font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Sofia IA (Instantâneo):
                  </span>
                  <p className="text-slate-100 text-[11px]">
                    "Você pode utilizar seu tronco SIP existente ou ativar um número virtual com portabilidade em minutos na plataforma."
                  </p>
                </div>
              </div>

              {/* Quick Action Dial Buttons */}
              <div className="pt-2 border-t border-[#1F2621] flex items-center justify-between gap-2">
                <button className="flex-1 py-2 rounded-xl bg-[#18201C] hover:bg-[#222B25] text-white border border-[#26332B] text-[11px] font-bold transition-all flex items-center justify-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 text-[#57EF40]" />
                  Mute
                </button>
                <button className="flex-1 py-2 rounded-xl bg-gradient-to-r from-[#57EF40] to-[#65C556] text-[#070908] text-[11px] font-extrabold shadow-glow-green hover:opacity-95 transition-all flex items-center justify-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  Concluir Venda
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. PROVA SOCIAL & ROI METRICS */}
      {/* ========================================================================= */}
      <section id="roi" className="border-y border-[#1F2621] bg-[#0c0f0d] py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-[#1F2621]">
            <div className="space-y-2 pt-4 md:pt-0">
              <span className="text-4xl lg:text-5xl font-black text-[#57EF40] font-mono">+46%</span>
              <h3 className="text-base font-bold text-white">Taxa de Contato Efetivo</h3>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Mais ligações completadas e menos tempo perdido digitando números manualmente.
              </p>
            </div>
            <div className="space-y-2 pt-6 md:pt-0">
              <span className="text-4xl lg:text-5xl font-black text-white font-mono">Zero</span>
              <h3 className="text-base font-bold text-white">Delay de Transbordo</h3>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                A Sofia IA atende e qualifica no primeiro segundo, passando o lead quente para o vendedor.
              </p>
            </div>
            <div className="space-y-2 pt-6 md:pt-0">
              <span className="text-4xl lg:text-5xl font-black text-[#57EF40] font-mono">3 min</span>
              <h3 className="text-base font-bold text-white">Setup do Workspace</h3>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Crie seu tenant, conecte seu WhatsApp e comece a operar imediatamente.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. BENTO GRID DE RECURSOS (Hierarquia Assimétrica) */}
      {/* ========================================================================= */}
      <section id="recursos" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-bold text-[#57EF40] uppercase tracking-widest">Tecnologia & Produtividade</span>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Projetado para eliminar cada segundo de atrito no seu time de vendas.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Card 1: Power Dialer Integrado (7 cols) */}
          <div className="md:col-span-7 rounded-3xl bg-[#111513] border border-[#1F2621] p-8 hover:border-[#57EF40]/40 transition-all flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#18201C] border border-[#26332B] flex items-center justify-center text-[#57EF40]">
                <PhoneCall className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-black text-white">Power Dialer WebRTC Integrado</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Dispare chamadas sem tirar as mãos do teclado. Tabulação instantânea pós-chamada, fila inteligente de discagem automática e gravação de áudio sincronizada à linha do tempo do lead.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-[#0c0f0d] border border-[#1F2621] flex items-center justify-between text-xs font-mono">
              <span className="text-muted-foreground">Latência WebRTC: <strong className="text-[#57EF40]">18ms</strong></span>
              <span className="text-muted-foreground">Codec: <strong className="text-white">Opus HD</strong></span>
              <span className="text-[#57EF40] font-bold">1-Click Redial</span>
            </div>
          </div>

          {/* Card 2: Agente Sofia IA (5 cols) */}
          <div className="md:col-span-5 rounded-3xl bg-[#111513] border border-[#1F2621] p-8 hover:border-[#57EF40]/40 transition-all flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#18201C] border border-[#26332B] flex items-center justify-center text-[#57EF40]">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-black text-white">Agente Sofia Inteligente</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Qualificação receptiva no WhatsApp baseada em documentos oficiais da sua empresa. Ativação automática de réguas de recuperação quando uma ligação não é atendida.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#57EF40]">
              <CheckCircle2 className="w-4 h-4" />
              <span>Base RAG com busca vetorial pgvector</span>
            </div>
          </div>

          {/* Card 3: CRM Kanban Contextual (5 cols) */}
          <div className="md:col-span-5 rounded-3xl bg-[#111513] border border-[#1F2621] p-8 hover:border-[#57EF40]/40 transition-all flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#18201C] border border-[#26332B] flex items-center justify-center text-[#57EF40]">
                <Kanban className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-black text-white">Pipeline Kanban Sem Atrito</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Linha do tempo contextualizada. Cada card armazena áudios de chamadas, transcrições, mensagens de WhatsApp e notas internas compartilhadas da equipe.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#57EF40]">
              <CheckCircle2 className="w-4 h-4" />
              <span>Arrastar & soltar com cálculo em tempo real</span>
            </div>
          </div>

          {/* Card 4: Infraestrutura & Segurança Bancária (7 cols) */}
          <div className="md:col-span-7 rounded-3xl bg-[#111513] border border-[#1F2621] p-8 hover:border-[#57EF40]/40 transition-all flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#18201C] border border-[#26332B] flex items-center justify-center text-[#57EF40]">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-black text-white">Infraestrutura Multi-Tenant & SLA 99.98%</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Isolamento estrito por Workspace, criptografia ponta a ponta para áudios e chats, conformidade com a LGPD e compatibilidade direta com gateways oficiais da Meta e Mercado Pago / Stripe.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="p-3 rounded-xl bg-[#0c0f0d] border border-[#1F2621]">
                <span className="block font-bold text-white">99.98%</span>
                <span className="text-[10px] text-muted-foreground">Uptime SLA</span>
              </div>
              <div className="p-3 rounded-xl bg-[#0c0f0d] border border-[#1F2621]">
                <span className="block font-bold text-white">AES-256</span>
                <span className="text-[10px] text-muted-foreground">Criptografia</span>
              </div>
              <div className="p-3 rounded-xl bg-[#0c0f0d] border border-[#1F2621]">
                <span className="block font-bold text-white">LGPD</span>
                <span className="text-[10px] text-muted-foreground">Conformidade</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. TABELA DE PLANOS & PREÇOS */}
      {/* ========================================================================= */}
      <section id="planos" className="py-24 border-t border-[#1F2621] bg-[#070908] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <span className="text-xs font-bold text-[#57EF40] uppercase tracking-widest">Investimento Transparente</span>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Escolha o plano ideal para a sua escala comercial.
          </h2>
          <p className="text-sm text-muted-foreground">
            Sem taxas ocultas. Cancele ou altere seu plano quando desejar com 1 clique.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="inline-flex items-center p-1.5 rounded-2xl bg-[#111513] border border-[#26332B] mt-4">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-[#18201C] text-white shadow-sm'
                  : 'text-muted-foreground hover:text-white'
              }`}
            >
              Faturamento Mensal
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                billingCycle === 'annual'
                  ? 'bg-gradient-to-r from-[#57EF40] to-[#65C556] text-[#070908] shadow-glow-green-sm'
                  : 'text-muted-foreground hover:text-white'
              }`}
            >
              <span>Faturamento Anual</span>
              <span className="px-1.5 py-0.2 rounded-full bg-[#070908] text-[#57EF40] text-[9px] font-extrabold">-20%</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const price = billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;

            return (
              <div
                key={plan.id}
                className={`rounded-3xl p-8 flex flex-col justify-between transition-all relative ${
                  plan.highlight
                    ? 'bg-[#111513] border-2 border-[#57EF40] shadow-glow-green-lg scale-100 lg:-translate-y-2'
                    : 'bg-[#111513] border border-[#1F2621] hover:border-[#26332B]'
                }`}
              >
                {/* Badge if highlighted */}
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-gradient-to-r from-[#57EF40] to-[#65C556] text-[#070908] text-[10px] font-black uppercase tracking-wider shadow-sm">
                    {plan.badge}
                  </div>
                )}

                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-black text-white">{plan.name}</h3>
                    <p className="text-xs text-muted-foreground mt-2 min-h-[36px]">{plan.description}</p>
                  </div>

                  {/* Price */}
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-1">
                      <span className="text-xs text-muted-foreground font-semibold">R$</span>
                      <span className="text-4xl font-black text-white font-mono">{price}</span>
                      <span className="text-xs text-muted-foreground">/mês</span>
                    </div>
                    {billingCycle === 'annual' && (
                      <p className="text-[11px] text-[#57EF40] font-semibold">Faturado anualmente com 20% de desconto</p>
                    )}
                  </div>

                  {/* Feature List */}
                  <ul className="space-y-3 pt-4 border-t border-[#1F2621] text-xs">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-[#57EF40] shrink-0 mt-0.5" />
                        <span className="text-[#F2F5F3]">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Card CTA */}
                <div className="pt-8">
                  <Link
                    href={`/register?plan=${plan.slug}&billing=${billingCycle}`}
                    className={`w-full py-3.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                      plan.highlight
                        ? 'bg-gradient-to-r from-[#57EF40] to-[#65C556] text-[#070908] shadow-glow-green hover:shadow-glow-green-lg active:scale-[0.98]'
                        : 'bg-[#18201C] hover:bg-[#202B25] text-white border border-[#26332B] hover:border-[#57EF40]/40'
                    }`}
                  >
                    <span>{plan.ctaText}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. FAQ SECTION */}
      {/* ========================================================================= */}
      <section id="faq" className="py-20 border-t border-[#1F2621] bg-[#0c0f0d] max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold text-[#57EF40] uppercase tracking-widest">Dúvidas Frequentes</span>
          <h2 className="text-3xl font-black text-white">Tudo o que você precisa saber</h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="rounded-2xl bg-[#111513] border border-[#1F2621] overflow-hidden transition-all">
              <button
                onClick={() => toggleFaq(i)}
                className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-white hover:text-[#57EF40] transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`w-4 h-4 shrink-0 transition-transform duration-200 ${openFaq === i ? 'rotate-180 text-[#57EF40]' : 'text-muted-foreground'}`} />
              </button>
              {openFaq === i && (
                <div className="px-5 pb-5 text-xs text-muted-foreground leading-relaxed border-t border-[#1F2621] pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. BOTTOM CALL TO ACTION */}
      {/* ========================================================================= */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-b from-[#111513] to-[#0c0f0d] border border-[#26332B] p-10 md:p-16 text-center space-y-6 relative overflow-hidden shadow-2xl">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[250px] bg-[#57EF40]/10 blur-3xl pointer-events-none" />
          
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight max-w-2xl mx-auto">
            Pronto para transformar sua operação comercial com telefonia e IA?
          </h2>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            Junte-se às operações de vendas que fecham mais negócios sem perder tempo entre ferramentas desconectadas.
          </p>
          <div className="pt-2">
            <Link
              href="/register?plan=pro&billing=monthly"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#57EF40] to-[#65C556] text-[#070908] text-sm font-black shadow-glow-green hover:shadow-glow-green-lg active:scale-[0.98] transition-all"
            >
              <span>Começar Demonstração Gratuita</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. EXECUTIVE FOOTER */}
      {/* ========================================================================= */}
      <footer className="border-t border-[#1F2621] bg-[#070908] py-12 text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#111513] border border-[#26332B] flex items-center justify-center text-[#57EF40]">
              <Activity className="w-4 h-4" />
            </div>
            <span className="font-bold text-white">CRDISK 2.0</span>
            <span className="text-muted-foreground/60">|</span>
            <span className="flex items-center gap-1.5 text-[11px] text-[#57EF40]">
              <span className="w-2 h-2 rounded-full bg-[#57EF40] animate-pulse" />
              Sistemas Operacionais (99.98% SLA)
            </span>
          </div>

          <div className="flex items-center gap-6 text-[11px]">
            <Link href="/login" className="hover:text-white transition-colors">Portal do Cliente</Link>
            <Link href="/register" className="hover:text-white transition-colors">Criar Conta</Link>
            <a href="#planos" className="hover:text-white transition-colors">Preços</a>
            <a href="#faq" className="hover:text-white transition-colors">Suporte</a>
          </div>

          <p className="text-[11px] text-muted-foreground/70">
            © {new Date().getFullYear()} CRDISK Tecnologia Ltda. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
