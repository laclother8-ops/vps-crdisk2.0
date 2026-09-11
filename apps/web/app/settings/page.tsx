'use client';

import React, { useEffect, useState } from 'react';
import { 
  Settings, 
  MessageSquare, 
  Phone, 
  Bot, 
  Copy, 
  Check, 
  Server,
  FileText,
  Upload,
  RefreshCw,
  ShieldCheck,
  Zap,
  Save,
  Key,
  Globe,
  Radio,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Sliders,
  Users
} from 'lucide-react';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { TeamManagement } from '../../components/settings/TeamManagement';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'ai' | 'rag' | 'telephony' | 'team'>('whatsapp');
  const [copied, setCopied] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Settings State
  const [waPhoneId, setWaPhoneId] = useState('104829104812903');
  const [waWabaId, setWaWabaId] = useState('109823019283012');
  const [waToken, setWaToken] = useState('EAAG3k9Z0••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••');
  const [waVerifyToken, setWaVerifyToken] = useState('crm_whatsapp_verify_token_secure_99');
  const [showWaToken, setShowWaToken] = useState(false);
  const [waTesting, setWaTesting] = useState(false);
  const [waTestResult, setWaTestResult] = useState<any>(null);

  // AI State
  const [openaiKey, setOpenaiKey] = useState('sk-proj-••••••••••••••••••••••••••••••••••••••••••••••••');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
  const [temperature, setTemperature] = useState(0.7);
  const [showAiKey, setShowAiKey] = useState(false);
  const [aiTesting, setAiTesting] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<any>(null);

  // Telephony State
  const [telephonyProvider, setTelephonyProvider] = useState<'twilio' | 'sip'>('twilio');
  const [twilioSid, setTwilioSid] = useState('');
  const [twilioAuthToken, setTwilioAuthToken] = useState('');
  const [twilioApiKey, setTwilioApiKey] = useState('');
  const [twilioCallerId, setTwilioCallerId] = useState('+5511999999999');
  const [sipServer, setSipServer] = useState('sip.crdisk.telecom.br');
  const [sipPort, setSipPort] = useState('5060');
  const [sipExtension, setSipExtension] = useState('1001');
  const [telTesting, setTelTesting] = useState(false);
  const [telTestResult, setTelTestResult] = useState<any>(null);

  // RAG State
  const [docTitle, setDocTitle] = useState('');
  const [docCategory, setDocCategory] = useState('PLANOS_PRECOS');
  const [docContent, setDocContent] = useState('');
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [knowledgeList, setKnowledgeList] = useState<any[]>([]);

  const webhookUrl = 'http://localhost:4000/api/webhooks/whatsapp';
  const telephonyWebhook = 'http://localhost:4000/api/telephony/webhooks/twilio';

  useEffect(() => {
    loadSettings();
    loadKnowledgeBase();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await api.getSettings();
      if (data) {
        if (data.whatsapp) {
          setWaPhoneId(data.whatsapp.phoneNumberId || '104829104812903');
          setWaWabaId(data.whatsapp.wabaId || '109823019283012');
          setWaVerifyToken(data.whatsapp.verifyToken || 'crm_whatsapp_verify_token_secure_99');
        }
        if (data.ai) {
          setSelectedModel(data.ai.defaultModel || 'gpt-4o-mini');
          setTemperature(data.ai.temperature ?? 0.7);
        }
        if (data.telephony) {
          setTelephonyProvider(data.telephony.provider || 'twilio');
          setTwilioCallerId(data.telephony.defaultCallerId || '+5511999999999');
          setSipServer(data.telephony.sipServer || 'sip.crdisk.telecom.br');
        }
      }
    } catch (e) {
      console.warn('Using default settings fallback');
    }
  };

  const loadKnowledgeBase = async () => {
    try {
      const kb = await api.getKnowledgeBase();
      setKnowledgeList(kb || []);
    } catch (e) {
      console.error('Failed to load KB:', e);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      await api.updateSettings({
        whatsapp: {
          phoneNumberId: waPhoneId,
          wabaId: waWabaId,
          accessToken: waToken,
          verifyToken: waVerifyToken,
          status: 'connected'
        },
        ai: {
          openaiApiKey: openaiKey,
          anthropicApiKey: anthropicKey,
          defaultModel: selectedModel,
          temperature,
          status: 'connected'
        },
        telephony: {
          provider: telephonyProvider,
          twilioAccountSid: twilioSid,
          defaultCallerId: twilioCallerId,
          sipServer,
          sipPort: parseInt(sipPort, 10),
          sipExtension,
          status: 'connected'
        }
      });
      setFeedback({ type: 'success', message: 'Configurações do CRDISK salvas com sucesso!' });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: `Erro ao salvar configurações: ${err.message}` });
      setTimeout(() => setFeedback(null), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestWhatsApp = async () => {
    setWaTesting(true);
    setWaTestResult(null);
    try {
      const res = await api.testWhatsAppConnection(waPhoneId, waToken);
      setWaTestResult(res);
    } catch (err: any) {
      setWaTestResult({ success: false, message: err.message });
    } finally {
      setWaTesting(false);
    }
  };

  const handleTestAI = async () => {
    setAiTesting(true);
    setAiTestResult(null);
    try {
      const res = await api.testAIConnection(openaiKey, selectedModel);
      setAiTestResult(res);
    } catch (err: any) {
      setAiTestResult({ success: false, message: err.message });
    } finally {
      setAiTesting(false);
    }
  };

  const handleTestTelephony = async () => {
    setTelTesting(true);
    setTelTestResult(null);
    try {
      const res = await api.testTelephonyConnection(telephonyProvider);
      setTelTestResult(res);
    } catch (err: any) {
      setTelTestResult({ success: false, message: err.message });
    } finally {
      setTelTesting(false);
    }
  };

  const handleUploadDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle || !docContent) return;

    setIsUploadingDoc(true);
    try {
      await api.addDocument(docTitle, docContent, docCategory);
      setDocTitle('');
      setDocContent('');
      await loadKnowledgeBase();
      setFeedback({ type: 'success', message: `Documento "${docTitle}" vetorizado no pgvector com sucesso!` });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: `Erro ao indexar documento: ${err.message}` });
    } finally {
      setIsUploadingDoc(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
              <Settings className="w-5 h-5 text-[#57EF40]" />
              Configurações e Integrações
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Gerencie canais de atendimento, assistente virtual, telefonia e membros da equipe.
          </p>
        </div>

        <button
          onClick={handleSaveAll}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#57EF40] to-[#65C556] hover:opacity-95 text-[#070908] text-xs font-extrabold shadow-glow-green active:scale-95 transition-all cursor-pointer"
        >
          {isSaving ? <RefreshCw className="w-4 h-4 animate-spin text-[#070908]" /> : <Save className="w-4 h-4 text-[#070908]" />}
          <span>{isSaving ? 'Salvando...' : 'Salvar Alterações'}</span>
        </button>
      </div>

      {feedback && (
        <div className={`p-4 rounded-2xl text-xs font-medium flex items-center gap-2.5 animate-fade-in ${
          feedback.type === 'success' 
            ? 'bg-[#18201C] border border-[#57EF40]/40 text-[#57EF40]' 
            : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-[#222924] pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('whatsapp')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'whatsapp'
              ? 'bg-[#18201C] text-white border border-[#222924] font-bold'
              : 'text-muted-foreground hover:text-foreground hover:bg-[#141815] border border-transparent'
          }`}
        >
          <MessageSquare className="w-4 h-4 text-[#57EF40]" />
          <span>Canal WhatsApp</span>
        </button>

        <button
          onClick={() => setActiveTab('ai')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'ai'
              ? 'bg-[#18201C] text-white border border-[#222924] font-bold'
              : 'text-muted-foreground hover:text-foreground hover:bg-[#141815] border border-transparent'
          }`}
        >
          <Bot className="w-4 h-4 text-[#57EF40]" />
          <span>Assistente Virtual</span>
        </button>

        <button
          onClick={() => setActiveTab('rag')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'rag'
              ? 'bg-[#18201C] text-white border border-[#222924] font-bold'
              : 'text-muted-foreground hover:text-foreground hover:bg-[#141815] border border-transparent'
          }`}
        >
          <Server className="w-4 h-4 text-[#57EF40]" />
          <span>Base de Treinamento</span>
        </button>

        <button
          onClick={() => setActiveTab('telephony')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'telephony'
              ? 'bg-[#18201C] text-white border border-[#222924] font-bold'
              : 'text-muted-foreground hover:text-foreground hover:bg-[#141815] border border-transparent'
          }`}
        >
          <Phone className="w-4 h-4 text-[#57EF40]" />
          <span>Telefonia e Ramais</span>
        </button>

        <button
          onClick={() => setActiveTab('team')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'team'
              ? 'bg-[#18201C] text-white border border-[#222924] font-bold'
              : 'text-muted-foreground hover:text-foreground hover:bg-[#141815] border border-transparent'
          }`}
        >
          <Users className="w-4 h-4 text-[#57EF40]" />
          <span>Gestão da Empresa e Equipe</span>
        </button>
      </div>

      {/* Tab 1: WhatsApp Cloud API */}
      {activeTab === 'whatsapp' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl glass-elevated border border-border space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-foreground">Credenciais Oficiais Meta WhatsApp Cloud API</h3>
                  <span className="text-[11px] text-muted-foreground">Graph API v20.0 com suporte a Webhooks bidirecionais</span>
                </div>
              </div>

              <Button onClick={handleTestWhatsApp} disabled={waTesting} variant="outline" size="sm" className="gap-2 text-xs border-border">
                {waTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary" /> : <Zap className="w-3.5 h-3.5 text-primary" />}
                <span>{waTesting ? 'Testando Conexão...' : 'Testar Conexão / Webhook'}</span>
              </Button>
            </div>

            {waTestResult && (
              <div className={`p-4 rounded-2xl text-xs font-mono flex items-start gap-2.5 animate-fade-in ${
                waTestResult.success ? 'bg-primary/10 border border-primary/30 text-primary' : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
              }`}>
                {waTestResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                <div>
                  <p className="font-bold">{waTestResult.message}</p>
                  {waTestResult.latencyMs && <span className="text-[10px] text-muted-foreground">Latência Meta: {waTestResult.latencyMs}ms</span>}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-muted-foreground block mb-1 font-bold">Phone Number ID (Meta App)</label>
                <input
                  type="text"
                  value={waPhoneId}
                  onChange={(e) => setWaPhoneId(e.target.value)}
                  className="w-full bg-surface border border-border focus:border-primary rounded-xl px-3 py-2.5 font-mono text-xs text-foreground outline-none transition-all"
                  placeholder="Ex: 104829104812903"
                />
              </div>

              <div>
                <label className="text-muted-foreground block mb-1 font-bold">WhatsApp Business Account ID (WABA ID)</label>
                <input
                  type="text"
                  value={waWabaId}
                  onChange={(e) => setWaWabaId(e.target.value)}
                  className="w-full bg-surface border border-border focus:border-primary rounded-xl px-3 py-2.5 font-mono text-xs text-foreground outline-none transition-all"
                  placeholder="Ex: 109823019283012"
                />
              </div>

              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-muted-foreground font-bold">Permanent System User Access Token</label>
                  <button 
                    type="button" 
                    onClick={() => setShowWaToken(!showWaToken)} 
                    className="text-[11px] text-primary flex items-center gap-1 hover:underline"
                  >
                    {showWaToken ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showWaToken ? 'Ocultar' : 'Exibir Token'}</span>
                  </button>
                </div>
                <input
                  type={showWaToken ? 'text' : 'password'}
                  value={waToken}
                  onChange={(e) => setWaToken(e.target.value)}
                  className="w-full bg-surface border border-border focus:border-primary rounded-xl px-3 py-2.5 font-mono text-xs text-foreground outline-none transition-all"
                  placeholder="EAAG..."
                />
              </div>
            </div>

            {/* Webhook Endpoint Config */}
            <div className="pt-4 border-t border-border/60 space-y-4">
              <h4 className="font-extrabold text-xs uppercase text-foreground tracking-wider flex items-center gap-2">
                <Globe className="w-4 h-4 text-primary" />
                Configuração do Webhook da Meta
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-muted-foreground block mb-1">Callback URL (Webhook de Recepção)</label>
                  <div className="flex items-center gap-2 bg-surface border border-border rounded-xl p-2.5 font-mono text-[11px] text-foreground">
                    <span className="truncate flex-1">{webhookUrl}</span>
                    <button
                      onClick={() => copyToClipboard(webhookUrl, 'wa_webhook')}
                      className="text-muted-foreground hover:text-primary p-1"
                    >
                      {copied === 'wa_webhook' ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-muted-foreground block mb-1">Verify Token de Validação (Hub Verify Token)</label>
                  <div className="flex items-center gap-2 bg-surface border border-border rounded-xl p-2.5 font-mono text-[11px] text-foreground">
                    <input
                      type="text"
                      value={waVerifyToken}
                      onChange={(e) => setWaVerifyToken(e.target.value)}
                      className="w-full bg-transparent outline-none font-mono text-[11px] text-foreground"
                    />
                    <button
                      onClick={() => copyToClipboard(waVerifyToken, 'wa_verify')}
                      className="text-muted-foreground hover:text-primary p-1"
                    >
                      {copied === 'wa_verify' ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: AI Providers (LLMs) */}
      {activeTab === 'ai' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl glass-elevated border border-border space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-foreground">Provedores de Inteligência Artificial & LLMs</h3>
                  <span className="text-[11px] text-muted-foreground">OpenAI GPT-4o & Anthropic Claude com Function Calling e Embeddings</span>
                </div>
              </div>

              <Button onClick={handleTestAI} disabled={aiTesting} variant="outline" size="sm" className="gap-2 text-xs border-border">
                {aiTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary" /> : <Zap className="w-3.5 h-3.5 text-primary" />}
                <span>{aiTesting ? 'Testando IA...' : 'Testar Conexão IA'}</span>
              </Button>
            </div>

            {aiTestResult && (
              <div className={`p-4 rounded-2xl text-xs font-mono flex items-start gap-2.5 animate-fade-in ${
                aiTestResult.success ? 'bg-primary/10 border border-primary/30 text-primary' : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
              }`}>
                {aiTestResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                <div>
                  <p className="font-bold">{aiTestResult.message}</p>
                  <span className="text-[10px] text-muted-foreground">Modelo: {aiTestResult.modelUsed} • Latência: {aiTestResult.latencyMs}ms</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-muted-foreground font-bold">OpenAI API Key (GPT-4o & Whisper)</label>
                  <button 
                    type="button" 
                    onClick={() => setShowAiKey(!showAiKey)} 
                    className="text-[11px] text-primary flex items-center gap-1 hover:underline"
                  >
                    {showAiKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showAiKey ? 'Ocultar' : 'Exibir'}</span>
                  </button>
                </div>
                <input
                  type={showAiKey ? 'text' : 'password'}
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  className="w-full bg-surface border border-border focus:border-primary rounded-xl px-3 py-2.5 font-mono text-xs text-foreground outline-none transition-all"
                  placeholder="sk-proj-..."
                />
              </div>

              <div>
                <label className="text-muted-foreground block mb-1 font-bold">Anthropic API Key (Claude Fallback)</label>
                <input
                  type="password"
                  value={anthropicKey}
                  onChange={(e) => setAnthropicKey(e.target.value)}
                  className="w-full bg-surface border border-border focus:border-primary rounded-xl px-3 py-2.5 font-mono text-xs text-foreground outline-none transition-all"
                  placeholder="sk-ant-..."
                />
              </div>

              <div>
                <label className="text-muted-foreground block mb-1 font-bold">Modelo Principal do Agente Sofia</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full bg-surface border border-border focus:border-primary rounded-xl px-3 py-2.5 font-mono text-xs text-foreground outline-none"
                >
                  <option value="gpt-4o-mini">OpenAI GPT-4o-mini (Recomendado - Baixa Latência)</option>
                  <option value="gpt-4o">OpenAI GPT-4o (Alta Precisão / Raciocínio Complexo)</option>
                  <option value="claude-3-5-sonnet">Anthropic Claude 3.5 Sonnet</option>
                  <option value="claude-3-haiku">Anthropic Claude 3 Haiku</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1 font-bold text-muted-foreground">
                  <span>Criatividade / Temperatura</span>
                  <span className="font-mono text-primary">{temperature}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full accent-primary mt-2"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Knowledge Base (RAG) Document Ingestion */}
      {activeTab === 'rag' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl glass-elevated border border-border space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-foreground">Upload de Documentos & Base Vetorial (RAG)</h3>
                  <span className="text-[11px] text-muted-foreground">Indexação automática com pgvector no PostgreSQL (1536 dimensões)</span>
                </div>
              </div>

              <span className="text-xs font-mono px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/25">
                {knowledgeList.length} Documentos Indexados
              </span>
            </div>

            {/* Document Ingestion Form */}
            <form onSubmit={handleUploadDoc} className="space-y-4 p-5 rounded-2xl bg-surface/60 border border-border">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="md:col-span-2">
                  <label className="text-muted-foreground block mb-1 font-bold">Título do Documento / Manual</label>
                  <input
                    type="text"
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    placeholder="Ex: Tabela de Preços e Planos 2026.pdf"
                    className="w-full bg-surface border border-border focus:border-primary rounded-xl px-3 py-2 text-xs text-foreground outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-muted-foreground block mb-1 font-bold">Categoria de Negócio</label>
                  <select
                    value={docCategory}
                    onChange={(e) => setDocCategory(e.target.value)}
                    className="w-full bg-surface border border-border focus:border-primary rounded-xl px-3 py-2 text-xs text-foreground outline-none"
                  >
                    <option value="PLANOS_PRECOS">Planos & Preços</option>
                    <option value="FUNCIONALIDADES">Funcionalidades do Produto</option>
                    <option value="INTEGRACOES">Integrações & Telefonia</option>
                    <option value="POLITICAS">Políticas & LGPD</option>
                    <option value="GERAL">Informações Gerais</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-muted-foreground block mb-1 font-bold text-xs">
                  Conteúdo do Documento (Cole o texto ou extração do PDF/TXT)
                </label>
                <textarea
                  rows={4}
                  value={docContent}
                  onChange={(e) => setDocContent(e.target.value)}
                  placeholder="Cole aqui o conteúdo oficial, regras de negócio ou especificações para a IA Sofia..."
                  className="w-full bg-surface border border-border focus:border-primary rounded-xl p-3 text-xs text-foreground outline-none resize-none"
                  required
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isUploadingDoc} size="sm" className="gap-2 text-xs">
                  {isUploadingDoc ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  <span>{isUploadingDoc ? 'Vetorizando Documento...' : 'Gerar Embeddings & Salvar no Postgres'}</span>
                </Button>
              </div>
            </form>

            {/* List of Indexed Documents */}
            <div className="space-y-3">
              <h4 className="font-extrabold text-xs uppercase text-foreground tracking-wider">
                Documentos Vetorizados na Base
              </h4>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {knowledgeList.map((doc: any) => (
                  <div key={doc.id} className="p-3.5 rounded-2xl bg-surface border border-border flex items-center justify-between text-xs hover:border-primary/40 transition-all">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="w-4 h-4 text-primary shrink-0" />
                      <div className="min-w-0">
                        <h5 className="font-bold text-foreground truncate">{doc.title}</h5>
                        <p className="text-[10px] text-muted-foreground font-mono">Categoria: {doc.category} • ID: {doc.id}</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20 shrink-0 shadow-glow-green-sm">
                      1536-dim pgvector
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Telephony Provider (Twilio / SIP) */}
      {activeTab === 'telephony' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl glass-elevated border border-border space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-foreground">Provedor de Telefonia VoIP & Discador WebRTC</h3>
                  <span className="text-[11px] text-muted-foreground">Twilio Voice SDK ou Conexão SIP Direta (FreePBX / Asterisk)</span>
                </div>
              </div>

              <Button onClick={handleTestTelephony} disabled={telTesting} variant="outline" size="sm" className="gap-2 text-xs border-border">
                {telTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary" /> : <Zap className="w-3.5 h-3.5 text-primary" />}
                <span>{telTesting ? 'Testando VoIP...' : 'Testar Conexão WebRTC'}</span>
              </Button>
            </div>

            {telTestResult && (
              <div className={`p-4 rounded-2xl text-xs font-mono flex items-start gap-2.5 animate-fade-in ${
                telTestResult.success ? 'bg-primary/10 border border-primary/30 text-primary' : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
              }`}>
                {telTestResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                <div>
                  <p className="font-bold">{telTestResult.message}</p>
                  {telTestResult.tokenPreview && (
                    <span className="text-[10px] text-muted-foreground block mt-1">
                      Token WebRTC Gerado: {telTestResult.tokenPreview}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Provider Toggle */}
            <div className="flex items-center gap-3 p-1.5 bg-surface border border-border rounded-2xl max-w-sm">
              <button
                type="button"
                onClick={() => setTelephonyProvider('twilio')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  telephonyProvider === 'twilio'
                    ? 'bg-primary text-background shadow-glow-green-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Twilio Voice SDK
              </button>
              <button
                type="button"
                onClick={() => setTelephonyProvider('sip')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  telephonyProvider === 'sip'
                    ? 'bg-primary text-background shadow-glow-green-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                SIP / Asterisk
              </button>
            </div>

            {telephonyProvider === 'twilio' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-muted-foreground block mb-1 font-bold">Twilio Account SID</label>
                  <input
                    type="text"
                    value={twilioSid}
                    onChange={(e) => setTwilioSid(e.target.value)}
                    className="w-full bg-surface border border-border focus:border-primary rounded-xl px-3 py-2.5 font-mono text-xs text-foreground outline-none"
                    placeholder="AC..."
                  />
                </div>

                <div>
                  <label className="text-muted-foreground block mb-1 font-bold">Twilio API Key SID</label>
                  <input
                    type="text"
                    value={twilioApiKey}
                    onChange={(e) => setTwilioApiKey(e.target.value)}
                    className="w-full bg-surface border border-border focus:border-primary rounded-xl px-3 py-2.5 font-mono text-xs text-foreground outline-none"
                    placeholder="SK..."
                  />
                </div>

                <div>
                  <label className="text-muted-foreground block mb-1 font-bold">Twilio Auth Token / Secret</label>
                  <input
                    type="password"
                    value={twilioAuthToken}
                    onChange={(e) => setTwilioAuthToken(e.target.value)}
                    className="w-full bg-surface border border-border focus:border-primary rounded-xl px-3 py-2.5 font-mono text-xs text-foreground outline-none"
                  />
                </div>

                <div>
                  <label className="text-muted-foreground block mb-1 font-bold">Caller ID Padrão de Saída (BINA)</label>
                  <input
                    type="text"
                    value={twilioCallerId}
                    onChange={(e) => setTwilioCallerId(e.target.value)}
                    className="w-full bg-surface border border-border focus:border-primary rounded-xl px-3 py-2.5 font-mono text-xs text-foreground outline-none"
                    placeholder="+5511999999999"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="text-muted-foreground block mb-1 font-bold">SIP Server Host / IP</label>
                  <input
                    type="text"
                    value={sipServer}
                    onChange={(e) => setSipServer(e.target.value)}
                    className="w-full bg-surface border border-border focus:border-primary rounded-xl px-3 py-2.5 font-mono text-xs text-foreground outline-none"
                    placeholder="sip.crdisk.telecom.br"
                  />
                </div>

                <div>
                  <label className="text-muted-foreground block mb-1 font-bold">Porta SIP</label>
                  <input
                    type="text"
                    value={sipPort}
                    onChange={(e) => setSipPort(e.target.value)}
                    className="w-full bg-surface border border-border focus:border-primary rounded-xl px-3 py-2.5 font-mono text-xs text-foreground outline-none"
                    placeholder="5060"
                  />
                </div>

                <div>
                  <label className="text-muted-foreground block mb-1 font-bold">Ramal Padrão do Operador</label>
                  <input
                    type="text"
                    value={sipExtension}
                    onChange={(e) => setSipExtension(e.target.value)}
                    className="w-full bg-surface border border-border focus:border-primary rounded-xl px-3 py-2.5 font-mono text-xs text-foreground outline-none"
                    placeholder="1001"
                  />
                </div>
              </div>
            )}

            {/* Status Callback Webhook */}
            <div className="pt-4 border-t border-border/60">
              <label className="text-muted-foreground block mb-1 text-xs">TwiML Status Callback URL (Eventos de Chamada)</label>
              <div className="flex items-center gap-2 bg-surface border border-border rounded-xl p-2.5 font-mono text-[11px] text-foreground">
                <span className="truncate flex-1">{telephonyWebhook}</span>
                <button
                  onClick={() => copyToClipboard(telephonyWebhook, 'tw_webhook')}
                  className="text-muted-foreground hover:text-primary p-1"
                >
                  {copied === 'tw_webhook' ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Team Management (RBAC) */}
      {activeTab === 'team' && (
        <TeamManagement />
      )}
    </div>
  );
}
