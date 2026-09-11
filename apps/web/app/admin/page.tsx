'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  Plus, 
  Users, 
  PhoneCall, 
  Bot, 
  ExternalLink, 
  ShieldAlert, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Power, 
  Lock, 
  Mail, 
  User, 
  FileText, 
  Activity, 
  Sparkles, 
  Crown,
  ChevronRight,
  Zap,
  X
} from 'lucide-react';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { useRouter } from 'next/navigation';

interface WorkspaceItem {
  id: string;
  name: string;
  slug: string;
  plan?: string;
  status: 'active' | 'suspended';
  subscriptionStatus?: 'trial' | 'active' | 'past_due' | 'canceled' | 'pending_payment';
  subscriptionPlan?: 'starter' | 'pro' | 'enterprise';
  trialEndsAt?: string | null;
  currentPeriodEnd?: string | null;
  createdAt: string;
  usersCount: number;
  leadsCount: number;
}

interface PlatformMetrics {
  totalWorkspaces: number;
  activeWorkspaces: number;
  suspendedWorkspaces: number;
  totalUsers: number;
  totalCalls: number;
  totalFollowups: number;
}

export default function SuperAdminPage() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isAccessDenied, setIsAccessDenied] = useState(false);

  // Create Workspace Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('052115wW@');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Impersonating state
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setFeedback(null);
    try {
      // Check current user role
      const userRole = typeof window !== 'undefined' ? localStorage.getItem('crdisk_user_role') : null;
      if (userRole && userRole !== 'superadmin' && userRole !== 'adm' && userRole !== 'ADMIN') {
        setIsAccessDenied(true);
        setIsLoading(false);
        return;
      }

      const [workspacesRes, metricsRes] = await Promise.all([
        api.getWorkspaces({ limit: 100 }),
        api.getAdminMetrics()
      ]);

      if (workspacesRes && workspacesRes.data) {
        setWorkspaces(workspacesRes.data);
      }
      if (metricsRes) {
        setMetrics(metricsRes);
      }
      setIsAccessDenied(false);
    } catch (err: any) {
      if (err.message && (err.message.includes('403') || err.message.includes('Acesso negado') || err.message.includes('Forbidden'))) {
        setIsAccessDenied(true);
      } else {
        setFeedback({ type: 'error', message: err.message || 'Erro ao carregar dados da plataforma.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !adminName.trim() || !adminEmail.trim() || !adminPassword.trim()) {
      setFeedback({ type: 'error', message: 'Preencha todos os campos obrigatórios.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const generatedSlug = slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      await api.createWorkspace({
        name: name.trim(),
        slug: generatedSlug,
        adminName: adminName.trim(),
        adminEmail: adminEmail.trim(),
        adminPassword: adminPassword
      });

      setFeedback({ type: 'success', message: `Workspace "${name}" e administrador criados com sucesso!` });
      setIsCreateModalOpen(false);
      setName('');
      setSlug('');
      setAdminName('');
      setAdminEmail('');
      setAdminPassword('052115wW@');
      await loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erro ao criar workspace.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (workspace: WorkspaceItem) => {
    const newStatus = workspace.status === 'active' ? 'suspended' : 'active';
    const actionName = newStatus === 'active' ? 'reativar' : 'suspender';
    if (!confirm(`Deseja realmente ${actionName} o workspace "${workspace.name}"?`)) return;

    try {
      await api.updateWorkspaceStatus(workspace.id, newStatus);
      setFeedback({ 
        type: 'success', 
        message: `Workspace "${workspace.name}" foi ${newStatus === 'active' ? 'reativado' : 'suspenso'} com sucesso.` 
      });
      await loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erro ao alterar status do workspace.' });
    }
  };

  const handleUpdateSubscription = async (
    workspace: WorkspaceItem, 
    newStatus: 'active' | 'trial' | 'pending_payment' | 'past_due' | 'canceled',
    plan?: string
  ) => {
    try {
      const nextMonth = new Date();
      nextMonth.setDate(nextMonth.getDate() + 30);
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      await api.updateWorkspaceSubscription(workspace.id, {
        subscriptionStatus: newStatus,
        subscriptionPlan: plan || workspace.subscriptionPlan || workspace.plan || 'pro',
        currentPeriodEnd: newStatus === 'active' ? nextMonth.toISOString() : null,
        trialEndsAt: newStatus === 'trial' ? nextWeek.toISOString() : null
      });

      setFeedback({
        type: 'success',
        message: `Status financeiro de "${workspace.name}" alterado para "${newStatus.toUpperCase()}" com sucesso.`
      });
      await loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erro ao alterar assinatura da empresa.' });
    }
  };

  const handleImpersonate = async (workspace: WorkspaceItem) => {
    setImpersonatingId(workspace.id);
    try {
      const session = await api.impersonateWorkspace(workspace.id);
      if (typeof window !== 'undefined') {
        localStorage.setItem('crdisk_active_workspace_id', workspace.id);
        localStorage.setItem('crdisk_active_workspace_name', workspace.name);
        localStorage.setItem('crdisk_impersonating', 'true');
        localStorage.setItem('crdisk_impersonated_at', new Date().toISOString());
      }
      setFeedback({ 
        type: 'success', 
        message: `Modo de Suporte ativado! Acessando ${workspace.name} como Administrador...` 
      });
      setTimeout(() => {
        router.push('/crm');
      }, 600);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erro ao acessar workspace.' });
      setImpersonatingId(null);
    }
  };

  const filteredWorkspaces = workspaces.filter(w => {
    const matchesSearch = w.name.toLowerCase().includes(search.toLowerCase()) || 
                          w.slug.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || w.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isAccessDenied) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <div className="bg-[#111513] border border-red-500/30 rounded-3xl p-8 max-w-lg text-center shadow-2xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-400">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white">Acesso Exclusivo Super Admin</h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            Esta área é reservada exclusivamente para os mantenedores da plataforma <span className="text-[#57EF40] font-semibold">CRDISK</span>. Seu usuário atual não possui credenciais master.
          </p>
          <div className="pt-4">
            <Button
              onClick={() => router.push('/crm')}
              className="bg-[#57EF40] hover:bg-[#65C556] text-black font-semibold"
            >
              Voltar ao Meu Workspace
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="bg-[#111513] border border-[#26332B] rounded-3xl p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#57EF40]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30 mb-3">
              <Crown className="w-3.5 h-3.5" />
              SaaS Multi-Tenant Control Panel
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              Super Admin CRDISK
              <span className="text-xs px-2.5 py-1 rounded-lg bg-[#57EF40]/10 text-[#57EF40] border border-[#57EF40]/30 font-mono">
                PLATFORM MASTER
              </span>
            </h1>
            <p className="text-sm text-gray-400 mt-2 max-w-2xl leading-relaxed">
              Monitore métricas globais de todos os clientes, crie novos Workspaces de empresas e acesse qualquer tenant em modo de suporte.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/health"
              className="inline-flex items-center px-3.5 py-2 rounded-xl bg-[#18201C] hover:bg-[#202B25] text-[#57EF40] border border-[#26332B] hover:border-[#57EF40]/40 text-xs font-bold transition-all shadow-glow-green-sm"
            >
              <Zap className="w-4 h-4 mr-1.5" />
              Homologação & Saúde
            </Link>

            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={isLoading}
              className="border-[#26332B] bg-[#18201C] hover:bg-[#202B25] text-gray-300"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin text-[#57EF40]' : ''}`} />
              Atualizar
            </Button>

            <Button
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-[#57EF40] hover:bg-[#65C556] text-black font-semibold shadow-lg shadow-[#57EF40]/20"
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar Novo Workspace
            </Button>
          </div>
        </div>
      </div>

      {/* Global Platform Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-[#111513] border border-[#26332B] rounded-2xl p-5 relative overflow-hidden shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total de Empresas</span>
            <div className="w-9 h-9 rounded-xl bg-[#57EF40]/10 border border-[#57EF40]/30 flex items-center justify-center text-[#57EF40]">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{metrics?.totalWorkspaces ?? workspaces.length}</span>
            <span className="text-xs text-emerald-400 font-medium">{metrics?.activeWorkspaces ?? workspaces.filter(w => w.status === 'active').length} ativas</span>
          </div>
          <div className="mt-2 text-[11px] text-gray-500">Tenants isolados no PostgreSQL</div>
        </div>

        <div className="bg-[#111513] border border-[#26332B] rounded-2xl p-5 relative overflow-hidden shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Usuários Totais</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{metrics?.totalUsers ?? 12}</span>
            <span className="text-xs text-blue-400 font-medium">RBAC ativo</span>
          </div>
          <div className="mt-2 text-[11px] text-gray-500">Admins & Operadores cadastrados</div>
        </div>

        <div className="bg-[#111513] border border-[#26332B] rounded-2xl p-5 relative overflow-hidden shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Ligações Efetuadas</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <PhoneCall className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{metrics?.totalCalls ?? 48}</span>
            <span className="text-xs text-amber-400 font-medium">WebRTC / SIP</span>
          </div>
          <div className="mt-2 text-[11px] text-gray-500">Histórico unificado de discagem</div>
        </div>

        <div className="bg-[#111513] border border-[#26332B] rounded-2xl p-5 relative overflow-hidden shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Follow-ups Agendados</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{metrics?.totalFollowups ?? 18}</span>
            <span className="text-xs text-emerald-400 font-medium">Motor IA Ativo</span>
          </div>
          <div className="mt-2 text-[11px] text-gray-500">Automação de mensagens WhatsApp</div>
        </div>
      </div>

      {/* Notifications */}
      {feedback && (
        <div className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
          feedback.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
            : 'bg-red-500/10 border-red-500/30 text-red-300'
        }`}>
          <div className="flex items-center gap-3">
            {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
            <span className="text-sm">{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-gray-400 hover:text-white text-sm">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Workspaces List & Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar por nome ou slug do workspace..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#111513] border border-[#26332B] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#57EF40] transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === 'all' 
                  ? 'bg-[#57EF40]/15 text-[#57EF40] border border-[#57EF40]/30' 
                  : 'bg-[#111513] text-gray-400 border border-[#26332B] hover:text-white'
              }`}
            >
              Todos ({workspaces.length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === 'active' 
                  ? 'bg-[#57EF40]/15 text-[#57EF40] border border-[#57EF40]/30' 
                  : 'bg-[#111513] text-gray-400 border border-[#26332B] hover:text-white'
              }`}
            >
              Ativos ({workspaces.filter(w => w.status === 'active').length})
            </button>
            <button
              onClick={() => setStatusFilter('suspended')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === 'suspended' 
                  ? 'bg-[#57EF40]/15 text-[#57EF40] border border-[#57EF40]/30' 
                  : 'bg-[#111513] text-gray-400 border border-[#26332B] hover:text-white'
              }`}
            >
              Suspensos ({workspaces.filter(w => w.status === 'suspended').length})
            </button>
          </div>
        </div>

        {/* Table of Workspaces */}
        <div className="bg-[#111513] border border-[#26332B] rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-[#18201C] border-b border-[#26332B] text-gray-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-4 px-6">Empresa / Workspace</th>
                  <th className="py-4 px-6">Slug & Identificador</th>
                  <th className="py-4 px-6 text-center">Usuários</th>
                  <th className="py-4 px-6 text-center">Leads CRM</th>
                  <th className="py-4 px-6">Status Operacional</th>
                  <th className="py-4 px-6">Status Financeiro (Assinatura)</th>
                  <th className="py-4 px-6 text-right">Acesso & Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#26332B]">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-500">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#57EF40]" />
                      Carregando workspaces da plataforma...
                    </td>
                  </tr>
                ) : filteredWorkspaces.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-500">
                      <Building2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      Nenhum workspace encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredWorkspaces.map((workspace) => {
                    const isSuspended = workspace.status === 'suspended';
                    const isBeingImpersonated = impersonatingId === workspace.id;
                    const subStatus = workspace.subscriptionStatus || (workspace.status === 'active' ? 'active' : 'pending_payment');

                    return (
                      <tr key={workspace.id} className="hover:bg-[#18201C]/50 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#18201C] border border-[#26332B] flex items-center justify-center font-bold text-[#57EF40]">
                              <Building2 className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="font-semibold text-white flex items-center gap-2">
                                {workspace.name}
                              </div>
                              <div className="text-xs text-gray-500 font-mono">
                                ID: {workspace.id.slice(0, 13)}...
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-6 font-mono text-xs text-gray-300">
                          <span className="bg-[#18201C] border border-[#26332B] px-2 py-1 rounded-md">
                            /{workspace.slug}
                          </span>
                        </td>

                        <td className="py-4 px-6 text-center">
                          <span className="inline-flex items-center gap-1 font-semibold text-white">
                            <Users className="w-3.5 h-3.5 text-gray-400" />
                            {workspace.usersCount || 1}
                          </span>
                        </td>

                        <td className="py-4 px-6 text-center">
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-400">
                            <Activity className="w-3.5 h-3.5 text-emerald-500" />
                            {workspace.leadsCount || 0}
                          </span>
                        </td>

                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            !isSuspended 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${!isSuspended ? 'bg-emerald-400' : 'bg-red-400'}`} />
                            {!isSuspended ? 'Ativo' : 'Suspenso'}
                          </span>
                        </td>

                        {/* Status Financeiro & 1-Click Fast Override */}
                        <td className="py-4 px-6">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                subStatus === 'active'
                                  ? 'bg-[#57EF40]/10 text-[#57EF40] border border-[#57EF40]/30'
                                  : subStatus === 'trial'
                                  ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                                  : subStatus === 'pending_payment'
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                  : 'bg-red-500/10 text-red-400 border border-red-500/30'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  subStatus === 'active' ? 'bg-[#57EF40]' :
                                  subStatus === 'trial' ? 'bg-purple-400' :
                                  subStatus === 'pending_payment' ? 'bg-amber-400' : 'bg-red-400'
                                }`} />
                                {subStatus === 'active' ? 'Ativo' :
                                 subStatus === 'trial' ? 'Trial Ativo' :
                                 subStatus === 'pending_payment' ? 'Pendente' :
                                 subStatus === 'past_due' ? 'Atrasado' : 'Cancelado'}
                              </span>

                              <span className="text-[10px] uppercase font-mono text-gray-400 px-1.5 py-0.5 rounded bg-[#18201C] border border-[#222924]">
                                {workspace.subscriptionPlan || workspace.plan || 'pro'}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                              {subStatus !== 'active' ? (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateSubscription(workspace, 'active')}
                                  className="px-2.5 py-1 rounded-lg bg-[#57EF40] hover:bg-[#65C556] text-[#070908] text-[10px] font-black shadow-sm flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                                  title="Liberar Acesso Manualmente (+30 dias de assinatura ativa)"
                                >
                                  <Zap className="w-3 h-3 fill-current" />
                                  <span>Liberar Acesso (Ativar)</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateSubscription(workspace, 'pending_payment')}
                                  className="px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[10px] font-bold border border-amber-500/30 flex items-center gap-1 transition-all cursor-pointer"
                                  title="Bloquear Acesso (Pendente de Pagamento)"
                                >
                                  <Lock className="w-3 h-3" />
                                  <span>Bloquear</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleUpdateSubscription(workspace, 'trial')}
                                className="px-2 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-[10px] font-bold border border-purple-500/30 transition-all cursor-pointer"
                                title="Conceder +7 Dias de Período Trial"
                              >
                                +7d Trial
                              </button>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              disabled={isBeingImpersonated}
                              onClick={() => handleImpersonate(workspace)}
                              className="bg-[#57EF40]/15 hover:bg-[#57EF40]/25 text-[#57EF40] border border-[#57EF40]/30 font-medium text-xs gap-1.5"
                            >
                              {isBeingImpersonated ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <ExternalLink className="w-3.5 h-3.5" />
                              )}
                              Acessar como Admin
                            </Button>

                            <button
                              title={isSuspended ? 'Reativar Workspace' : 'Suspender Workspace'}
                              onClick={() => handleToggleStatus(workspace)}
                              className={`p-2 rounded-lg border transition-colors ${
                                !isSuspended 
                                  ? 'bg-[#18201C] border-[#26332B] hover:bg-red-950/40 text-gray-400 hover:text-red-400 hover:border-red-800/40' 
                                  : 'bg-emerald-950/30 border-emerald-800/40 text-emerald-400 hover:bg-emerald-900/40'
                              }`}
                            >
                              <Power className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal: Criar Novo Workspace */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111513] border border-[#26332B] rounded-3xl w-full max-w-lg p-6 relative shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2 text-white font-bold text-lg">
                <Building2 className="w-5 h-5 text-[#57EF40]" />
                Criar Novo Workspace (Tenant)
              </div>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-400 mb-5 leading-relaxed">
              Crie um novo ambiente isolado para o cliente com seu próprio banco de dados lógico e credenciais de administrador.
            </p>

            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Nome da Empresa <span className="text-[#57EF40]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: TechCorp Inovação"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!slug) {
                        setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                      }
                    }}
                    className="w-full bg-[#18201C] border border-[#26332B] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#57EF40]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Slug / URL Identificadora
                  </label>
                  <input
                    type="text"
                    placeholder="techcorp-inovacao"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full bg-[#18201C] border border-[#26332B] rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#57EF40]"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-[#26332B]">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                  Administrador Inicial do Workspace
                </h4>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                      Nome do Administrador <span className="text-[#57EF40]">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input
                        type="text"
                        required
                        placeholder="Ex: Roberto Lima"
                        value={adminName}
                        onChange={(e) => setAdminName(e.target.value)}
                        className="w-full bg-[#18201C] border border-[#26332B] rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-[#57EF40]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                      E-mail do Administrador <span className="text-[#57EF40]">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input
                        type="email"
                        required
                        placeholder="roberto@techcorp.com.br"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        className="w-full bg-[#18201C] border border-[#26332B] rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-[#57EF40]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                      Senha Provisória <span className="text-[#57EF40]">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input
                        type="password"
                        required
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        className="w-full bg-[#18201C] border border-[#26332B] rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-[#57EF40]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#26332B]">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="border-[#26332B] bg-[#18201C] text-gray-300"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting}
                  className="bg-[#57EF40] hover:bg-[#65C556] text-black font-semibold"
                >
                  {isSubmitting ? 'Criando Workspace...' : 'Criar Workspace'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
