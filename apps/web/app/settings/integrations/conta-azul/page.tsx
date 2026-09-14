'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  Key, 
  RefreshCw, 
  Save, 
  Eye, 
  EyeOff, 
  ExternalLink, 
  ShieldCheck, 
  Zap,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import { api } from '../../../../lib/api';

export default function ContaAzulSettingsPage() {
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [redirectUri, setRedirectUri] = useState('');
  const [isEnabled, setIsEnabled] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setIsLoading(true);
      const data = await api.getContaAzulConfig();
      if (data) {
        setClientId(data.clientId || '');
        setClientSecret(data.clientSecret || '');
        setRedirectUri(data.redirectUri || (typeof window !== 'undefined' ? `${window.location.origin}/api/settings/integrations/conta-azul/callback` : ''));
        setIsEnabled(data.isEnabled || false);
        setHasToken(data.hasToken || false);
      }
    } catch (err) {
      console.warn('Using default Conta Azul empty config:', err);
      if (typeof window !== 'undefined') {
        setRedirectUri(`${window.location.origin}/api/settings/integrations/conta-azul/callback`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setIsSaving(true);
      setSaveSuccess(false);
      await api.saveContaAzulConfig({
        clientId,
        clientSecret,
        redirectUri,
        isEnabled
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(`Erro ao salvar configurações: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setIsTesting(true);
      setTestResult(null);
      const res = await api.testContaAzulConnection({
        clientId,
        clientSecret
      });
      setTestResult({
        success: res.connected ?? true,
        message: res.message || 'Conexão com a API Conta Azul estabelecida com sucesso!'
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `Falha na conexão: ${err.message}`
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-[#070908] p-6 space-y-6 overflow-y-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/settings"
              className="text-xs text-muted-foreground hover:text-white flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar para Configurações</span>
            </Link>
          </div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              Integração Conta Azul (REST API v1)
            </h1>
            <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border ${
              hasToken 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
            }`}>
              {hasToken ? 'OAuth2 Conectado' : 'Aguardando Credenciais'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Sincronização bidirecional de clientes, pedidos de venda e contas a receber
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTesting || !clientId}
            className="px-3.5 py-2 rounded-xl bg-[#111513] hover:bg-[#18201C] text-muted-foreground hover:text-white border border-[#222924] font-semibold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-[#57EF40]' : ''}`} />
            <span>Testar Conexão</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl bg-[#57EF40] hover:bg-[#65C556] text-[#070908] font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-[#57EF40]/10 active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Salvando...' : 'Salvar Configuração'}</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Configurações do Conta Azul salvas com sucesso!</span>
        </div>
      )}

      {testResult && (
        <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
          testResult.success 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          {testResult.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{testResult.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Settings (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="p-6 rounded-2xl bg-[#111513] border border-[#222924] space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#222924]">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-[#57EF40]" />
                <h3 className="font-bold text-sm text-white">Credenciais de Aplicativo Conta Azul</h3>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isEnabled}
                  onChange={(e) => setIsEnabled(e.target.checked)}
                  className="rounded border-[#222924] bg-[#0c0f0d] text-[#57EF40] focus:ring-0"
                />
                <span className="text-xs text-white font-bold">Habilitar Integração</span>
              </label>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">
                  Client ID *
                </label>
                <input
                  type="text"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="Ex: c1a2b3c4-5d6e-7f8g-9h0i-1j2k3l4m5n6o"
                  className="w-full px-3 py-2 rounded-xl bg-[#0c0f0d] border border-[#222924] text-xs text-white font-mono focus:outline-none focus:border-[#57EF40]"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Identificador público do seu aplicativo gerado no portal do desenvolvedor Conta Azul
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">
                  Client Secret *
                </label>
                <div className="relative">
                  <input
                    type={showSecret ? 'text' : 'password'}
                    value={clientSecret}
                    onChange={(e) => setClientSecret(e.target.value)}
                    placeholder="••••••••••••••••••••••••••••••••"
                    className="w-full pl-3 pr-10 py-2 rounded-xl bg-[#0c0f0d] border border-[#222924] text-xs text-white font-mono focus:outline-none focus:border-[#57EF40]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-white"
                  >
                    {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">
                  URL de Redirecionamento (Redirect URI)
                </label>
                <input
                  type="text"
                  value={redirectUri}
                  onChange={(e) => setRedirectUri(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0c0f0d] border border-[#222924] text-xs text-white font-mono focus:outline-none focus:border-[#57EF40]"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Insira esta mesma URL no cadastro do seu aplicativo no portal Conta Azul
                </p>
              </div>
            </div>
          </div>

          {/* Automation Rules */}
          <div className="p-6 rounded-2xl bg-[#111513] border border-[#222924] space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#222924]">
              <Zap className="w-4 h-4 text-[#57EF40]" />
              <h3 className="font-bold text-sm text-white">Gatilhos de Automação Comercial</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-[#0c0f0d] border border-[#222924] flex items-center justify-between">
                <div>
                  <h6 className="font-bold text-white">Criação Automática de Venda</h6>
                  <p className="text-[11px] text-muted-foreground">
                    Quando o pedido atingir a etapa "Faturado" ou "Entregue", sincronizar como venda aprovada.
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#57EF40]/10 text-[#57EF40] border border-[#57EF40]/20">
                  Ativo
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#0c0f0d] border border-[#222924] flex items-center justify-between">
                <div>
                  <h6 className="font-bold text-white">Geração de Contas a Receber</h6>
                  <p className="text-[11px] text-muted-foreground">
                    Lançar títulos a receber no módulo financeiro do Conta Azul com base nas parcelas do pedido.
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#57EF40]/10 text-[#57EF40] border border-[#57EF40]/20">
                  Ativo
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#0c0f0d] border border-[#222924] flex items-center justify-between">
                <div>
                  <h6 className="font-bold text-white">Sincronização de Cadastro de Clientes</h6>
                  <p className="text-[11px] text-muted-foreground">
                    Localizar ou cadastrar automaticamente o contato pelo CPF/CNPJ ou telefone antes de criar o pedido.
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#57EF40]/10 text-[#57EF40] border border-[#57EF40]/20">
                  Ativo
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Instructions & Documentation (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 rounded-2xl bg-[#111513] border border-[#222924] space-y-3">
            <div className="flex items-center gap-2 text-[#57EF40]">
              <ShieldCheck className="w-4 h-4" />
              <h4 className="font-bold text-xs uppercase tracking-wider">Como Integrar</h4>
            </div>

            <ol className="space-y-2.5 text-xs text-muted-foreground list-decimal list-inside leading-relaxed">
              <li>
                Acesse o <a href="https://portal.contaazul.com" target="_blank" rel="noopener noreferrer" className="text-[#57EF40] hover:underline inline-flex items-center gap-0.5">Portal Conta Azul <ExternalLink className="w-2.5 h-2.5" /></a> e crie uma conta de desenvolvedor.
              </li>
              <li>
                Crie um novo Aplicativo e selecione os escopos de <strong>Vendas</strong>, <strong>Clientes</strong> e <strong>Produtos</strong>.
              </li>
              <li>
                Copie o <strong>Client ID</strong> e o <strong>Client Secret</strong> fornecidos e cole nos campos ao lado.
              </li>
              <li>
                Configure a <strong>URL de Redirecionamento</strong> idêntica à indicada nesta página.
              </li>
              <li>
                Clique em <strong>Salvar Configuração</strong> e execute o teste de conexão.
              </li>
            </ol>
          </div>

          <div className="p-4 rounded-2xl bg-[#111513] border border-[#222924] space-y-2 text-xs">
            <h5 className="font-bold text-white flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#57EF40]" />
              Multi-tenant Isolado
            </h5>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              As credenciais do Conta Azul são isoladas por Workspace. Cada empresa cadastrada no CRDISK possui suas próprias chaves e livros contábeis independentes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
