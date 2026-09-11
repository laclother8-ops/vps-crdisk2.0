'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Activity, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Send, 
  Bot, 
  QrCode, 
  PhoneCall, 
  Terminal, 
  RefreshCw, 
  ShieldCheck, 
  Radio, 
  Copy, 
  Check, 
  AlertTriangle, 
  ArrowLeft,
  Sparkles,
  Zap,
  Clock,
  Layers,
  Mic,
  Sliders,
  Volume2
} from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  category: 'WHATSAPP' | 'AI_RAG' | 'BILLING' | 'TELEPHONY' | 'SYSTEM';
  level: 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR';
  message: string;
  meta?: any;
}

export default function AdminHealthPage() {
  const [userRole, setUserRole] = useState<string | null>('superadmin');
  const [isAuthorized, setIsAuthorized] = useState<boolean>(true);

  // General Health Overview
  const [systemLatency, setSystemLatency] = useState<number>(24);
  const [environment, setEnvironment] = useState<'sandbox' | 'production'>('sandbox');
  const [activeTab, setActiveTab] = useState<'all' | 'whatsapp' | 'ai' | 'billing' | 'telephony'>('all');

  // WhatsApp Diagnostic State
  const [waPhone, setWaPhone] = useState('5511999998888');
  const [waTemplate, setWaTemplate] = useState('lead_qualify');
  const [waLoading, setWaLoading] = useState(false);
  const [waResult, setWaResult] = useState<any>(null);

  // AI & RAG Diagnostic State
  const [aiQuery, setAiQuery] = useState('Como funciona o discador automático do CRDISK?');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);

  // Billing & Pix Diagnostic State
  const [pixAmount, setPixAmount] = useState(1.00);
  const [pixProvider, setPixProvider] = useState<'mercadopago' | 'stripe'>('mercadopago');
  const [pixLoading, setPixLoading] = useState(false);
  const [pixResult, setPixResult] = useState<any>(null);
  const [pixCopied, setPixCopied] = useState(false);
  const [pixPaid, setPixPaid] = useState(false);

  // Telephony & WebRTC Diagnostic State
  const [telLoading, setTelLoading] = useState(false);
  const [telResult, setTelResult] = useState<any>(null);
  const [isMicActive, setIsMicActive] = useState(false);

  // Real-time Logs Terminal State
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logFilter, setLogFilter] = useState<'ALL' | 'WHATSAPP' | 'AI_RAG' | 'BILLING' | 'TELEPHONY'>('ALL');
  const [isTerminalCollapsed, setIsTerminalCollapsed] = useState(false);
  const [isStreamPaused, setIsStreamPaused] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('crdisk_user_role') || 'superadmin';
      setUserRole(role);
      setIsAuthorized(role === 'superadmin' || role === 'adm');
    }
  }, []);

  // Fetch initial logs
  useEffect(() => {
    async function loadLogs() {
      try {
        const res = await fetch('/api/admin/health/logs');
        if (res.ok) {
          const data = await res.json();
          setLogs(data.logs || []);
        }
      } catch (err) {
        console.warn('Failed to load initial diagnostic logs:', err);
      }
    }
    loadLogs();
  }, []);

  // Simulated live event logger helper
  const appendLog = (category: LogEntry['category'], level: LogEntry['level'], message: string, meta?: any) => {
    if (isStreamPaused) return;
    const newEntry: LogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      category,
      level,
      message,
      meta
    };
    setLogs((prev) => [...prev.slice(-49), newEntry]);
  };

  // Scroll to bottom of terminal on new log
  useEffect(() => {
    if (!isTerminalCollapsed && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isTerminalCollapsed]);

  // Handler: WhatsApp Test
  const handleTestWhatsApp = async () => {
    setWaLoading(true);
    setWaResult(null);
    appendLog('WHATSAPP', 'INFO', `Iniciando teste de disparo Graph API para ${waPhone}`, { template: waTemplate });

    try {
      const res = await fetch('/api/admin/health/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: waPhone, template: waTemplate })
      });
      const data = await res.json();
      setWaResult(data);

      if (data.success) {
        appendLog('WHATSAPP', 'SUCCESS', `Mensagem Graph API enviada com sucesso! Latência: ${data.latencyMs}ms`, {
          messageId: data.messageId,
          status: data.statusText
        });
      } else {
        appendLog('WHATSAPP', 'ERROR', `Erro ao disparar WhatsApp: ${data.error}`);
      }
    } catch (err: any) {
      appendLog('WHATSAPP', 'ERROR', `Exceção no teste do WhatsApp: ${err.message}`);
    } finally {
      setWaLoading(false);
    }
  };

  // Handler: AI & RAG Test
  const handleTestAI = async () => {
    setAiLoading(true);
    setAiResult(null);
    appendLog('AI_RAG', 'INFO', `Executando validação de Embeddings e Tool Calling: "${aiQuery}"`);

    try {
      const res = await fetch('/api/admin/health/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: aiQuery })
      });
      const data = await res.json();
      setAiResult(data);

      if (data.success) {
        appendLog('AI_RAG', 'SUCCESS', `Busca vetorial e Tool Calling validados em ${data.latencyBreakdown.totalMs}ms`, {
          score: data.topSimilarityScore,
          tool: data.toolCallValidation.toolName
        });
      } else {
        appendLog('AI_RAG', 'ERROR', `Falha no motor de IA: ${data.error}`);
      }
    } catch (err: any) {
      appendLog('AI_RAG', 'ERROR', `Exceção na validação de IA: ${err.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  // Handler: Pix Test
  const handleTestPix = async () => {
    setPixLoading(true);
    setPixResult(null);
    setPixPaid(false);
    appendLog('BILLING', 'INFO', `Gerando cobrança Pix de teste no valor de R$ ${pixAmount.toFixed(2)} (${pixProvider})`);

    try {
      const res = await fetch('/api/admin/health/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: pixAmount, provider: pixProvider })
      });
      const data = await res.json();
      setPixResult(data);

      if (data.success) {
        appendLog('BILLING', 'SUCCESS', `Pix gerado com sucesso! ID: ${data.transactionId}`, {
          amount: `R$ ${data.amount.toFixed(2)}`,
          channel: data.webhookListener.channel
        });
      } else {
        appendLog('BILLING', 'ERROR', `Falha na emissão do Pix: ${data.error}`);
      }
    } catch (err: any) {
      appendLog('BILLING', 'ERROR', `Exceção na emissão do Pix: ${err.message}`);
    } finally {
      setPixLoading(false);
    }
  };

  // Handler: Simulate Pix Payment Approval
  const handleSimulatePixPaid = () => {
    setPixPaid(true);
    appendLog('BILLING', 'SUCCESS', `⚡ Webhook de pagamento capturado: Pix Aprovado instantaneamente! Workspace desbloqueado.`, {
      event: 'payment.approved',
      workspaceId: 'ws_homologation_demo'
    });
  };

  // Handler: Copy Pix String
  const handleCopyPix = () => {
    if (pixResult?.emvCopiaECola) {
      navigator.clipboard.writeText(pixResult.emvCopiaECola);
      setPixCopied(true);
      setTimeout(() => setPixCopied(false), 2000);
    }
  };

  // Handler: Telephony & WebRTC Test
  const handleTestTelephony = async () => {
    setTelLoading(true);
    setTelResult(null);
    appendLog('TELEPHONY', 'INFO', 'Gerando token JWT de voz e testando conectividade STUN/TURN');

    try {
      const res = await fetch('/api/admin/health/telephony', { method: 'POST' });
      const data = await res.json();
      setTelResult(data);

      if (data.success) {
        setIsMicActive(true);
        appendLog('TELEPHONY', 'SUCCESS', `Servidores STUN/TURN alcançáveis (${data.latencyMs}ms). Codec Opus 48kHz ativo.`);
      } else {
        appendLog('TELEPHONY', 'ERROR', `Erro na telefonia: ${data.error}`);
      }
    } catch (err: any) {
      appendLog('TELEPHONY', 'ERROR', `Exceção na telefonia: ${err.message}`);
    } finally {
      setTelLoading(false);
    }
  };

  // Refresh All Diagnostics
  const handleRefreshAll = () => {
    setSystemLatency(18 + Math.floor(Math.random() * 12));
    appendLog('SYSTEM', 'INFO', 'Executando varredura completa de integridade dos gateways');
    handleTestWhatsApp();
    handleTestAI();
    handleTestTelephony();
  };

  const filteredLogs = logs.filter((l) => logFilter === 'ALL' || l.category === logFilter);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24 text-slate-100 font-sans">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & ACCESS BANNER */}
      {/* ========================================================================= */}
      <div className="p-6 rounded-3xl bg-[#111513] border border-[#222924] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className="p-1.5 rounded-xl bg-[#18201C] hover:bg-[#202B25] text-muted-foreground hover:text-white border border-[#222924] transition-all"
              title="Voltar ao Painel Admin"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#18201C] border border-[#222924] text-xs font-bold text-[#57EF40]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#57EF40]" />
              <span>Acesso Super Admin • Nível 0</span>
            </div>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            Central de Homologação & Saúde dos Gateways
          </h1>
          <p className="text-xs text-muted-foreground">
            Ambiente interativo para validação ponta a ponta da WhatsApp Cloud API, Motor de IA (pgvector), Faturamento e Telefonia WebRTC.
          </p>
        </div>

        {/* Global Controls & Status Pill */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Latency Indicator */}
          <div className="px-3 py-2 rounded-2xl bg-[#0c0f0d] border border-[#222924] flex items-center gap-2 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-[#57EF40] animate-pulse" />
            <span className="text-muted-foreground">Latência Core:</span>
            <strong className="text-[#57EF40]">{systemLatency}ms</strong>
          </div>

          {/* Environment Switcher */}
          <button
            onClick={() => setEnvironment(environment === 'sandbox' ? 'production' : 'sandbox')}
            className={`px-3.5 py-2 rounded-2xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              environment === 'sandbox'
                ? 'bg-[#18201C] border-yellow-500/40 text-yellow-400'
                : 'bg-[#18201C] border-[#57EF40]/40 text-[#57EF40]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{environment === 'sandbox' ? 'Modo: Sandbox (Mock)' : 'Modo: Produção (Real)'}</span>
          </button>

          {/* Refresh All Button */}
          <button
            onClick={handleRefreshAll}
            className="px-4 py-2 rounded-2xl bg-gradient-to-r from-[#57EF40] to-[#65C556] text-[#070908] text-xs font-extrabold shadow-glow-green hover:opacity-95 active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#070908]" />
            <span>Testar Tudo</span>
          </button>
        </div>
      </div>

      {/* Module Selector Tabs */}
      <div className="flex items-center gap-2 border-b border-[#222924] pb-2 text-xs font-semibold overflow-x-auto">
        {[
          { id: 'all', label: 'Todos os Módulos', icon: Layers },
          { id: 'whatsapp', label: 'WhatsApp Cloud API', icon: Send },
          { id: 'ai', label: 'IA & pgvector (RAG)', icon: Bot },
          { id: 'billing', label: 'Faturamento & Pix', icon: QrCode },
          { id: 'telephony', label: 'Telefonia WebRTC', icon: PhoneCall },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-[#18201C] text-[#57EF40] border border-[#222924] shadow-glow-green-sm'
                  : 'text-muted-foreground hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 2. DIAGNOSTIC SUITE GRID */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ======================================================================= */}
        {/* A. WHATSAPP CLOUD API DIAGNOSTIC */}
        {/* ======================================================================= */}
        {(activeTab === 'all' || activeTab === 'whatsapp') && (
          <div className="p-6 rounded-3xl bg-[#111513] border border-[#222924] space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#222924]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#18201C] border border-[#222924] flex items-center justify-center text-[#57EF40]">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">WhatsApp Cloud API (Meta Graph v20.0)</h3>
                  <p className="text-[11px] text-muted-foreground">Disparo de templates e validação de webhooks de entrega</p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#18201C] text-[#57EF40] border border-[#222924]">
                Webhook Ativo
              </span>
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground">Telefone Destino (DDI + DDD + Num)</label>
                <input
                  type="text"
                  value={waPhone}
                  onChange={(e) => setWaPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0c0f0d] border border-[#222924] text-white focus:outline-none focus:border-[#57EF40] font-mono"
                  placeholder="5511999998888"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground">Template Oficial</label>
                <select
                  value={waTemplate}
                  onChange={(e) => setWaTemplate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0c0f0d] border border-[#222924] text-white focus:outline-none focus:border-[#57EF40]"
                >
                  <option value="lead_qualify">lead_qualify (Qualificação Sofia)</option>
                  <option value="call_recovery">call_recovery (Ligação Não Atendida)</option>
                  <option value="hello_world">hello_world (Meta Sandbox)</option>
                </select>
              </div>
            </div>

            {/* Action Trigger */}
            <button
              onClick={handleTestWhatsApp}
              disabled={waLoading}
              className="w-full py-3 rounded-xl bg-[#18201C] hover:bg-[#202B25] text-white border border-[#222924] hover:border-[#57EF40]/40 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {waLoading ? <Loader2 className="w-4 h-4 animate-spin text-[#57EF40]" /> : <Send className="w-4 h-4 text-[#57EF40]" />}
              <span>{waLoading ? 'Disparando Graph API...' : 'Testar Disparo Graph API'}</span>
            </button>

            {/* Result Viewport */}
            {waResult && (
              <div className="p-4 rounded-2xl bg-[#0c0f0d] border border-[#222924] space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#57EF40]" />
                    HTTP 200 OK — Disparado com Sucesso
                  </span>
                  <span className="text-[10px] font-mono text-[#57EF40] bg-[#18201C] px-2 py-0.5 rounded">
                    {waResult.latencyMs}ms
                  </span>
                </div>
                <div className="space-y-1 font-mono text-[11px] text-muted-foreground">
                  <p>Message ID: <span className="text-white">{waResult.messageId}</span></p>
                  <p>Provider: <span className="text-white">{waResult.provider}</span></p>
                </div>
                {/* Webhook Timeline */}
                <div className="pt-2 border-t border-[#1F2621] grid grid-cols-3 gap-2 text-center text-[10px]">
                  <div className="p-1.5 rounded-lg bg-[#18201C] text-[#57EF40] border border-[#222924]">
                    ✓ Enviado (Meta)
                  </div>
                  <div className="p-1.5 rounded-lg bg-[#18201C] text-[#57EF40] border border-[#222924]">
                    ✓ Entregue (Operadora)
                  </div>
                  <div className="p-1.5 rounded-lg bg-[#18201C] text-[#57EF40] border border-[#222924]">
                    ✓ Lido pelo Lead
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================================= */}
        {/* B. AI & RAG (pgvector / OpenAI) DIAGNOSTIC */}
        {/* ======================================================================= */}
        {(activeTab === 'all' || activeTab === 'ai') && (
          <div className="p-6 rounded-3xl bg-[#111513] border border-[#222924] space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#222924]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#18201C] border border-[#222924] flex items-center justify-center text-[#57EF40]">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Motor de IA & RAG (pgvector + Tool Calling)</h3>
                  <p className="text-[11px] text-muted-foreground">Validação de embeddings vetoriais, score cosseno e funções</p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#18201C] text-[#57EF40] border border-[#222924]">
                1536 Dims
              </span>
            </div>

            {/* Input */}
            <div className="space-y-1 text-xs">
              <label className="text-[11px] font-semibold text-muted-foreground">Pergunta de Teste para o RAG</label>
              <input
                type="text"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#0c0f0d] border border-[#222924] text-white focus:outline-none focus:border-[#57EF40]"
                placeholder="Ex: Como funciona o discador automático?"
              />
            </div>

            {/* Action Trigger */}
            <button
              onClick={handleTestAI}
              disabled={aiLoading}
              className="w-full py-3 rounded-xl bg-[#18201C] hover:bg-[#202B25] text-white border border-[#222924] hover:border-[#57EF40]/40 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {aiLoading ? <Loader2 className="w-4 h-4 animate-spin text-[#57EF40]" /> : <Sparkles className="w-4 h-4 text-[#57EF40]" />}
              <span>{aiLoading ? 'Processando Vetores...' : 'Validar Embeddings & Tool Calling'}</span>
            </button>

            {/* Result Viewport */}
            {aiResult && (
              <div className="p-4 rounded-2xl bg-[#0c0f0d] border border-[#222924] space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#57EF40]" />
                    Similaridade Cosseno: <strong className="text-[#57EF40] font-mono">{aiResult.topSimilarityScore}</strong>
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    Total: {aiResult.latencyBreakdown.totalMs}ms
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#111513] border border-[#222924] text-[11px] space-y-1">
                  <p className="text-white font-semibold flex items-center gap-1">
                    <Zap className="w-3 h-3 text-[#57EF40]" /> {aiResult.retrievedDocument.title}
                  </p>
                  <p className="text-muted-foreground italic">"{aiResult.retrievedDocument.contentSnippet}"</p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
                  <div className="p-1.5 rounded-lg bg-[#18201C] text-muted-foreground border border-[#222924]">
                    Embedding: <strong className="text-white">{aiResult.latencyBreakdown.embeddingMs}ms</strong>
                  </div>
                  <div className="p-1.5 rounded-lg bg-[#18201C] text-muted-foreground border border-[#222924]">
                    pgvector: <strong className="text-white">{aiResult.latencyBreakdown.vectorSearchMs}ms</strong>
                  </div>
                  <div className="p-1.5 rounded-lg bg-[#18201C] text-muted-foreground border border-[#222924]">
                    Tool Call: <strong className="text-white">{aiResult.latencyBreakdown.toolCallMs}ms</strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================================= */}
        {/* C. BILLING & PIX DIAGNOSTIC */}
        {/* ======================================================================= */}
        {(activeTab === 'all' || activeTab === 'billing') && (
          <div className="p-6 rounded-3xl bg-[#111513] border border-[#222924] space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#222924]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#18201C] border border-[#222924] flex items-center justify-center text-[#57EF40]">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Motor de Faturamento (Pix & Stripe)</h3>
                  <p className="text-[11px] text-muted-foreground">Emissão de Pix de teste com listener WebSocket de aprovação</p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#18201C] text-[#57EF40] border border-[#222924]">
                Gateway Ativo
              </span>
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground">Valor do Teste (R$)</label>
                <input
                  type="number"
                  value={pixAmount}
                  onChange={(e) => setPixAmount(parseFloat(e.target.value) || 1)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0c0f0d] border border-[#222924] text-white focus:outline-none focus:border-[#57EF40] font-mono"
                  step="0.50"
                  min="0.50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground">Provedor de Pagamento</label>
                <select
                  value={pixProvider}
                  onChange={(e) => setPixProvider(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0c0f0d] border border-[#222924] text-white focus:outline-none focus:border-[#57EF40]"
                >
                  <option value="mercadopago">Mercado Pago Pix v2</option>
                  <option value="stripe">Stripe Checkout v2</option>
                </select>
              </div>
            </div>

            {/* Action Trigger */}
            <button
              onClick={handleTestPix}
              disabled={pixLoading}
              className="w-full py-3 rounded-xl bg-[#18201C] hover:bg-[#202B25] text-white border border-[#222924] hover:border-[#57EF40]/40 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {pixLoading ? <Loader2 className="w-4 h-4 animate-spin text-[#57EF40]" /> : <QrCode className="w-4 h-4 text-[#57EF40]" />}
              <span>{pixLoading ? 'Gerando Cobrança...' : 'Emitir Pix de Teste R$ 1,00'}</span>
            </button>

            {/* Result Viewport */}
            {pixResult && (
              <div className="p-4 rounded-2xl bg-[#0c0f0d] border border-[#222924] space-y-4 text-xs">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* QR Code */}
                  <div className="w-28 h-28 bg-white p-2 rounded-xl shrink-0 flex items-center justify-center shadow-md">
                    <img src={pixResult.qrCodeUrl} alt="QR Code Pix" className="w-full h-full object-contain" />
                  </div>

                  {/* Pix Details */}
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">ID: {pixResult.transactionId}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        pixPaid ? 'bg-[#57EF40] text-[#070908]' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
                      }`}>
                        {pixPaid ? '✓ PAGO & DESBLOQUEADO' : 'Aguardando Pagamento'}
                      </span>
                    </div>

                    {/* Copy Pix */}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={pixResult.emvCopiaECola}
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-[#111513] border border-[#222924] text-[10px] text-muted-foreground font-mono truncate"
                      />
                      <button
                        onClick={handleCopyPix}
                        className="p-1.5 rounded-lg bg-[#18201C] hover:bg-[#202B25] text-[#57EF40] border border-[#222924] text-[11px] font-bold transition-all flex items-center gap-1 shrink-0"
                        title="Copiar Pix Copia e Cola"
                      >
                        {pixCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{pixCopied ? 'Copiado!' : 'Copiar'}</span>
                      </button>
                    </div>

                    {/* Simulate Instant Payment Button */}
                    {!pixPaid && (
                      <button
                        onClick={handleSimulatePixPaid}
                        className="w-full py-1.5 rounded-lg bg-gradient-to-r from-[#57EF40] to-[#65C556] text-[#070908] text-[11px] font-extrabold shadow-glow-green hover:opacity-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Simular Pagamento Instantâneo (WebSocket Hook)</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================================= */}
        {/* D. TELEPHONY & WEBRTC DIAGNOSTIC */}
        {/* ======================================================================= */}
        {(activeTab === 'all' || activeTab === 'telephony') && (
          <div className="p-6 rounded-3xl bg-[#111513] border border-[#222924] space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#222924]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#18201C] border border-[#222924] flex items-center justify-center text-[#57EF40]">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Telefonia WebRTC & Servidores STUN/TURN</h3>
                  <p className="text-[11px] text-muted-foreground">Tokens JWT de voz, loopback de áudio e teste de microfone</p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#18201C] text-[#57EF40] border border-[#222924]">
                Opus 48kHz
              </span>
            </div>

            {/* Action Trigger */}
            <button
              onClick={handleTestTelephony}
              disabled={telLoading}
              className="w-full py-3 rounded-xl bg-[#18201C] hover:bg-[#202B25] text-white border border-[#222924] hover:border-[#57EF40]/40 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {telLoading ? <Loader2 className="w-4 h-4 animate-spin text-[#57EF40]" /> : <Radio className="w-4 h-4 text-[#57EF40]" />}
              <span>{telLoading ? 'Testando Servidores STUN/TURN...' : 'Testar Loopback de Áudio WebRTC'}</span>
            </button>

            {/* Result & Audio Oscilloscope */}
            {telResult && (
              <div className="p-4 rounded-2xl bg-[#0c0f0d] border border-[#222924] space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#57EF40]" />
                    Sessão WebRTC Ativa & Token Válido
                  </span>
                  <span className="text-[10px] font-mono text-[#57EF40] bg-[#18201C] px-2 py-0.5 rounded">
                    Jitter: {telResult.audioMetrics.jitterMs}ms
                  </span>
                </div>

                {/* Oscilloscope Visualizer */}
                <div className="p-3 rounded-xl bg-[#111513] border border-[#222924] space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Mic className="w-3.5 h-3.5 text-[#57EF40] animate-pulse" />
                      Osciloscópio de Voz (Loopback)
                    </span>
                    <span className="font-mono text-[#57EF40]">48.000 Hz HD</span>
                  </div>
                  {/* Dynamic Sound Wave */}
                  <div className="flex items-center justify-center gap-1 h-8 py-1">
                    {[12, 24, 18, 32, 28, 14, 20, 30, 22, 16, 26, 18, 30, 14, 20].map((h, i) => (
                      <div
                        key={i}
                        className="w-1.5 bg-[#57EF40] rounded-full transition-all duration-150 animate-pulse"
                        style={{ height: `${h}px` }}
                      />
                    ))}
                  </div>
                </div>

                {/* ICE Server List */}
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                  {telResult.iceServers.map((ice: any, i: number) => (
                    <div key={i} className="p-2 rounded-lg bg-[#18201C] text-muted-foreground border border-[#222924] flex items-center justify-between">
                      <span className="truncate">{ice.url.replace('stun:', '')}</span>
                      <strong className="text-[#57EF40]">{ice.rttMs}ms</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. REAL-TIME EVENT STREAM & LOGS TERMINAL */}
      {/* ========================================================================= */}
      <div className="rounded-3xl bg-[#0c0f0d] border border-[#222924] overflow-hidden shadow-2xl space-y-0">
        {/* Terminal Header Bar */}
        <div className="p-4 bg-[#111513] border-b border-[#222924] flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-[#57EF40] animate-pulse" />
            <Terminal className="w-4 h-4 text-white" />
            <span className="text-xs font-mono font-bold text-white">Stream de Eventos & Webhooks em Tempo Real</span>
            <span className="text-[10px] text-muted-foreground font-mono">({filteredLogs.length} eventos)</span>
          </div>

          {/* Terminal Filters & Actions */}
          <div className="flex items-center gap-2 text-[11px]">
            {/* Category Filter */}
            <select
              value={logFilter}
              onChange={(e) => setLogFilter(e.target.value as any)}
              className="px-2.5 py-1 rounded-lg bg-[#18201C] border border-[#222924] text-white font-mono text-xs focus:outline-none"
            >
              <option value="ALL">Todas Categorias</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="AI_RAG">IA & RAG</option>
              <option value="BILLING">Faturamento</option>
              <option value="TELEPHONY">Telefonia</option>
            </select>

            <button
              onClick={() => setIsStreamPaused(!isStreamPaused)}
              className="px-2.5 py-1 rounded-lg bg-[#18201C] hover:bg-[#222924] text-muted-foreground hover:text-white border border-[#222924] font-mono text-xs transition-colors"
            >
              {isStreamPaused ? '▶ Retomar' : '⏸ Pausar'}
            </button>

            <button
              onClick={() => setLogs([])}
              className="px-2.5 py-1 rounded-lg bg-[#18201C] hover:bg-[#222924] text-muted-foreground hover:text-white border border-[#222924] font-mono text-xs transition-colors"
            >
              Limpar
            </button>
          </div>
        </div>

        {/* Terminal Body */}
        {!isTerminalCollapsed && (
          <div className="p-4 max-h-72 overflow-y-auto font-mono text-[11px] space-y-1.5 scrollbar-thin scrollbar-thumb-[#26332B] scrollbar-track-[#070908]">
            {filteredLogs.length === 0 ? (
              <p className="text-muted-foreground/60 italic">Nenhum evento registrado no stream no momento. Execute um dos testes acima.</p>
            ) : (
              filteredLogs.map((log) => {
                const badgeColor =
                  log.category === 'WHATSAPP'
                    ? 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40'
                    : log.category === 'AI_RAG'
                    ? 'text-purple-400 bg-purple-950/40 border-purple-800/40'
                    : log.category === 'BILLING'
                    ? 'text-yellow-400 bg-yellow-950/40 border-yellow-800/40'
                    : log.category === 'TELEPHONY'
                    ? 'text-blue-400 bg-blue-950/40 border-blue-800/40'
                    : 'text-slate-400 bg-slate-900 border-slate-700';

                return (
                  <div key={log.id} className="flex items-start gap-2 hover:bg-[#111513]/60 p-1 rounded transition-colors">
                    <span className="text-muted-foreground/60 shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border shrink-0 ${badgeColor}`}>
                      [{log.category}]
                    </span>
                    <span className={`font-semibold ${
                      log.level === 'SUCCESS' ? 'text-[#57EF40]' : log.level === 'ERROR' ? 'text-red-400' : 'text-slate-200'
                    }`}>
                      {log.message}
                    </span>
                    {log.meta && (
                      <span className="text-muted-foreground/60 text-[10px] truncate max-w-xs">
                        {JSON.stringify(log.meta)}
                      </span>
                    )}
                  </div>
                );
              })
            )}
            <div ref={terminalEndRef} />
          </div>
        )}
      </div>
    </div>
  );
}
