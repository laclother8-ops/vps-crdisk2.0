'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  UserPlus, 
  Shield, 
  KeyRound, 
  Trash2, 
  Edit2, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Lock, 
  Mail, 
  User as UserIcon,
  ShieldAlert,
  Headphones,
  Check,
  X,
  Copy,
  Clock,
  Send,
  AlertTriangle,
  UserCheck,
  UserX,
  ArrowRightLeft,
  ChevronDown
} from 'lucide-react';
import { api } from '../../lib/api';
import { Button } from '../ui/Button';
import { UpgradePlanModal } from '../billing/UpgradePlanModal';
import { USER_ROLE_LABELS, WorkspaceInvite } from '@omnicrm/shared';

interface TeamUser {
  id: string;
  name: string;
  email: string;
  role: string;
  workspaceId: string;
  status: string;
  isActive?: boolean;
  createdAt?: string;
}

export function TeamManagement() {
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [invites, setInvites] = useState<WorkspaceInvite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isAccessDenied, setIsAccessDenied] = useState(false);

  // Invite Modal
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('SALES_REP');
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false);
  const [lastGeneratedInviteUrl, setLastGeneratedInviteUrl] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Upgrade Plan Modal state
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [upgradeData, setUpgradeData] = useState<{ plan: string; current: number; limit: number }>({
    plan: 'starter',
    current: 1,
    limit: 1
  });

  // Edit Role Modal
  const [isEditRoleOpen, setIsEditRoleOpen] = useState(false);
  const [selectedUserForRole, setSelectedUserForRole] = useState<TeamUser | null>(null);
  const [newRoleValue, setNewRoleValue] = useState('SALES_REP');
  const [isSavingRole, setIsSavingRole] = useState(false);

  // Reassign Clients Modal
  const [isReassignOpen, setIsReassignOpen] = useState(false);
  const [fromUser, setFromUser] = useState<TeamUser | null>(null);
  const [targetUserId, setTargetUserId] = useState<string>('');
  const [isReassigning, setIsReassigning] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [membersRes, invitesRes] = await Promise.all([
        api.getTeamMembers().catch(() => ({ users: [] })),
        api.getPendingInvites().catch(() => ({ invites: [] }))
      ]);

      if (membersRes && membersRes.users) {
        setUsers(membersRes.users);
      } else if (Array.isArray(membersRes)) {
        setUsers(membersRes);
      }

      if (invitesRes && invitesRes.invites) {
        setInvites(invitesRes.invites);
      }

      setIsAccessDenied(false);
    } catch (err: any) {
      if (err.message && (err.message.includes('403') || err.message.includes('Acesso negado') || err.message.includes('Forbidden'))) {
        setIsAccessDenied(true);
      } else {
        setFeedback({ type: 'error', message: err.message || 'Erro ao carregar equipe.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = 
        !search.trim() ||
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());

      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  // Handle Invite Submission
  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setIsSubmittingInvite(true);
    setFeedback(null);

    try {
      const res = await api.inviteTeamMember({
        email: inviteEmail.trim(),
        name: inviteName.trim() || undefined,
        role: inviteRole
      });

      const fullUrl = `${window.location.origin}${res.inviteUrl}`;
      setLastGeneratedInviteUrl(fullUrl);

      // Reload invites & users
      loadData();
      setFeedback({ type: 'success', message: `Convite enviado para ${inviteEmail}! Link gerado abaixo.` });
    } catch (err: any) {
      if (err.message && (err.message.includes('PLAN_LIMIT_REACHED') || err.message.includes('limite'))) {
        setIsInviteModalOpen(false);
        setUpgradeData({
          plan: err.plan || 'starter',
          current: err.current || users.filter(u => u.isActive !== false).length,
          limit: err.limit || 1
        });
        setIsUpgradeModalOpen(true);
      } else {
        setFeedback({ type: 'error', message: err.message || 'Erro ao enviar convite.' });
      }
    } finally {
      setIsSubmittingInvite(false);
    }
  };

  // Toggle Active / Deactivate (Preserving records)
  const handleToggleStatus = async (user: TeamUser) => {
    const nextStatus = user.isActive === false;
    const confirmMsg = nextStatus 
      ? `Deseja reativar o acesso de ${user.name}?` 
      : `Deseja bloquear o acesso de ${user.name}? O histórico de vendas e ligações deste operador será preservado.`;

    if (!confirm(confirmMsg)) return;

    try {
      await api.toggleUserStatus(user.id, nextStatus);
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isActive: nextStatus, status: nextStatus ? 'active' : 'inactive' } : u));
      setFeedback({ type: 'success', message: `Acesso de ${user.name} ${nextStatus ? 'reativado' : 'bloqueado'} com sucesso.` });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erro ao alterar status de acesso.' });
    }
  };

  // Save New Role
  const handleSaveRole = async () => {
    if (!selectedUserForRole) return;
    try {
      setIsSavingRole(true);
      await api.updateUserRole(selectedUserForRole.id, newRoleValue);
      setUsers(prev => prev.map(u => u.id === selectedUserForRole.id ? { ...u, role: newRoleValue } : u));
      setIsEditRoleOpen(false);
      setSelectedUserForRole(null);
      setFeedback({ type: 'success', message: 'Função do operador atualizada com sucesso.' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erro ao alterar papel.' });
    } finally {
      setIsSavingRole(false);
    }
  };

  // Reassign Leads / Clients
  const handleReassign = async () => {
    if (!fromUser || !targetUserId) return;
    try {
      setIsReassigning(true);
      const res = await api.reassignUserClients(fromUser.id, targetUserId);
      setIsReassignOpen(false);
      setFromUser(null);
      setTargetUserId('');
      setFeedback({ type: 'success', message: res.message || 'Clientes e pedidos reatribuídos com sucesso!' });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erro ao reatribuir clientes.' });
    } finally {
      setIsReassigning(false);
    }
  };

  // Resend Invite
  const handleResendInvite = async (inviteId: string) => {
    try {
      const res = await api.resendInvite(inviteId);
      const fullUrl = `${window.location.origin}${res.inviteUrl}`;
      navigator.clipboard.writeText(fullUrl);
      setCopiedToken(inviteId);
      setTimeout(() => setCopiedToken(null), 3000);
      setFeedback({ type: 'success', message: 'Link de convite renovado e copiado para a área de transferência!' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erro ao reenviar convite.' });
    }
  };

  // Cancel Invite
  const handleCancelInvite = async (inviteId: string) => {
    if (!confirm('Deseja cancelar este convite? O link deixará de ser válido.')) return;
    try {
      await api.cancelInvite(inviteId);
      setInvites(prev => prev.filter(i => i.id !== inviteId));
      setFeedback({ type: 'success', message: 'Convite cancelado com sucesso.' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erro ao cancelar convite.' });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken('last-generated');
    setTimeout(() => setCopiedToken(null), 3000);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'bg-purple-950/40 text-purple-200 border-purple-800/40 font-bold';
      case 'ADMIN':
      case 'workspace_admin':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30 font-bold';
      case 'SALES_REP':
      case 'operator':
        return 'bg-[#57EF40]/10 text-[#57EF40] border-[#57EF40]/30 font-bold';
      case 'STOCK_OPERATOR':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30 font-bold';
      case 'FINANCIAL':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-bold';
      default:
        return 'bg-[#18201C] text-gray-300 border-[#222924] font-semibold';
    }
  };

  if (isAccessDenied) {
    return (
      <div className="p-8 rounded-3xl bg-[#111513] border border-red-500/20 text-center space-y-4 max-w-md mx-auto mt-12">
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white">Acesso Restrito</h3>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Apenas o <strong>Proprietário (Owner)</strong> ou <strong>Administrador</strong> da empresa têm permissão para gerenciar a equipe e convidar novos integrantes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#111513] border border-[#222924]">
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por nome ou e-mail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#0c0f0d] border border-[#222924] text-xs text-white placeholder:text-muted-foreground focus:outline-none focus:border-[#57EF40] transition-colors"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-[#0c0f0d] border border-[#222924] text-xs text-white focus:outline-none focus:border-[#57EF40]"
          >
            <option value="all">Todos os Cargos</option>
            <option value="OWNER">Proprietário (Owner)</option>
            <option value="ADMIN">Administrador</option>
            <option value="SALES_REP">Vendas & SDR</option>
            <option value="STOCK_OPERATOR">Operador de Estoque</option>
            <option value="FINANCIAL">Financeiro</option>
          </select>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadData}
            className="p-2 rounded-xl bg-[#18201C] hover:bg-[#202B25] text-muted-foreground hover:text-white border border-[#222924] transition-colors"
            title="Atualizar equipe"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#57EF40]' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => {
              setLastGeneratedInviteUrl(null);
              setIsInviteModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-[#57EF40] hover:bg-[#65C556] text-[#070908] font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-[#57EF40]/10 active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Convidar Integrante</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
          feedback.type === 'success' 
            ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' 
            : 'bg-red-500/10 border border-red-500/30 text-red-400'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Members Table */}
      <div className="rounded-2xl border border-[#222924] bg-[#0c0f0d] overflow-hidden shadow-xl">
        <div className="px-5 py-3.5 border-b border-[#222924] bg-[#111513] flex items-center justify-between">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <span>Membros Ativos & Cadastrados</span>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-[#18201C] text-[#57EF40] border border-[#222924]">
              {filteredUsers.length} integrantes
            </span>
          </h4>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#111513] border-b border-[#222924] text-[10px] text-muted-foreground uppercase">
              <tr>
                <th className="py-3 px-4">Integrante</th>
                <th className="py-3 px-4">Cargo / Perfil</th>
                <th className="py-3 px-4 text-center">Status de Acesso</th>
                <th className="py-3 px-4 text-center">Data Ingresso</th>
                <th className="py-3 px-4 text-right">Ações Rápidas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222924]">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground text-xs">
                    Nenhum integrante encontrado.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => {
                  const isActive = user.isActive !== false;

                  return (
                    <tr key={user.id} className="hover:bg-[#111513] transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-[#18201C] border border-[#222924] flex items-center justify-center font-bold text-xs text-white">
                            {user.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <span>{user.name}</span>
                            </div>
                            <div className="text-[11px] text-muted-foreground font-mono">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-md border ${getRoleBadge(user.role)}`}>
                          {USER_ROLE_LABELS[user.role] || user.role}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        {isActive ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#57EF40]/10 text-[#57EF40] border border-[#57EF40]/30 inline-flex items-center gap-1">
                            <UserCheck className="w-3 h-3" />
                            Ativo
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/30 inline-flex items-center gap-1">
                            <UserX className="w-3 h-3" />
                            Acesso Bloqueado
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center text-muted-foreground font-mono text-[11px]">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : '-'}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Editar Cargo */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedUserForRole(user);
                              setNewRoleValue(user.role);
                              setIsEditRoleOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-[#18201C] hover:bg-[#202B25] text-xs text-gray-300 hover:text-white border border-[#222924] transition-colors"
                            title="Editar papel"
                          >
                            Editar Função
                          </button>

                          {/* Reatribuir Carteira de Clientes */}
                          <button
                            type="button"
                            onClick={() => {
                              setFromUser(user);
                              setIsReassignOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-[#18201C] hover:bg-[#202B25] text-muted-foreground hover:text-amber-400 border border-[#222924] transition-colors"
                            title="Reatribuir clientes deste operador"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                          </button>

                          {/* Bloquear / Ativar Acesso */}
                          {user.role !== 'OWNER' && (
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(user)}
                              className={`p-1.5 rounded-lg border transition-colors ${
                                isActive 
                                  ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30' 
                                  : 'bg-[#57EF40]/10 hover:bg-[#57EF40]/20 text-[#57EF40] border-[#57EF40]/30'
                              }`}
                              title={isActive ? 'Bloquear acesso' : 'Reativar acesso'}
                            >
                              {isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                            </button>
                          )}
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

      {/* Pending Invites Section */}
      <div className="rounded-2xl border border-[#222924] bg-[#0c0f0d] overflow-hidden shadow-xl">
        <div className="px-5 py-3.5 border-b border-[#222924] bg-[#111513] flex items-center justify-between">
          <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>Convites Pendentes de Aceite</span>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-[#18201C] text-amber-400 border border-amber-500/30">
              {invites.length} pendentes
            </span>
          </h4>
        </div>

        <div className="p-4 space-y-2.5">
          {invites.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground border border-dashed border-[#222924] rounded-xl">
              Nenhum convite pendente. Clique em "+ Convidar Integrante" para convidar novos operadores.
            </div>
          ) : (
            invites.map(invite => {
              const fullUrl = typeof window !== 'undefined' ? `${window.location.origin}/invite/${invite.token}` : `/invite/${invite.token}`;

              return (
                <div
                  key={invite.id}
                  className="p-3.5 rounded-xl bg-[#111513] border border-[#222924] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{invite.email}</span>
                      {invite.name && (
                        <span className="text-[11px] text-muted-foreground">({invite.name})</span>
                      )}
                      <span className={`text-[9px] px-2 py-0.5 rounded-md border ${getRoleBadge(invite.role)}`}>
                        {USER_ROLE_LABELS[invite.role] || invite.role}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      Expira em: {new Date(invite.expiresAt).toLocaleDateString('pt-BR')} às {new Date(invite.expiresAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => copyToClipboard(fullUrl)}
                      className="px-2.5 py-1.5 rounded-lg bg-[#18201C] hover:bg-[#202B25] text-xs font-semibold text-gray-200 border border-[#222924] flex items-center gap-1 transition-colors"
                      title="Copiar link de convite"
                    >
                      {copiedToken === 'last-generated' ? <Check className="w-3.5 h-3.5 text-[#57EF40]" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copiar Link</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleResendInvite(invite.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-[#18201C] hover:bg-[#202B25] text-xs font-semibold text-gray-200 border border-[#222924] flex items-center gap-1 transition-colors"
                    >
                      <Send className="w-3.5 h-3.5 text-[#57EF40]" />
                      <span>Renovar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCancelInvite(invite.id)}
                      className="p-1.5 rounded-lg bg-[#18201C] hover:bg-red-500/20 text-muted-foreground hover:text-red-400 border border-[#222924] transition-colors"
                      title="Cancelar convite"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal: Convidar Integrante */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-[#0c0f0d] border border-[#222924] rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#222924] flex items-center justify-between bg-[#111513]">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#57EF40]" />
                <h3 className="font-bold text-sm text-white">Convidar Integrante para Equipe</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsInviteModalOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-white hover:bg-[#18201C]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendInvite} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">
                  E-mail Corporativo *
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="vendedor@empresa.com.br"
                  className="w-full px-3 py-2 rounded-xl bg-[#111513] border border-[#222924] text-xs text-white focus:outline-none focus:border-[#57EF40]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">
                  Nome Completo (Opcional)
                </label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="Ex: João da Silva"
                  className="w-full px-3 py-2 rounded-xl bg-[#111513] border border-[#222924] text-xs text-white focus:outline-none focus:border-[#57EF40]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">
                  Função / Perfil de Acesso *
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#111513] border border-[#222924] text-xs text-white focus:outline-none focus:border-[#57EF40]"
                >
                  <option value="SALES_REP">Vendas & SDR (Acesso ao CRM, Chat e Pedidos)</option>
                  <option value="STOCK_OPERATOR">Operador de Estoque (Estoque e Separação)</option>
                  <option value="FINANCIAL">Financeiro (Pedidos, Faturamento e Conta Azul)</option>
                  <option value="ADMIN">Administrador (Gestão de Equipe e Sistema)</option>
                </select>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Vendedores (SALES_REP) visualizam apenas os seus próprios leads e pedidos atribuídos.
                </p>
              </div>

              {lastGeneratedInviteUrl && (
                <div className="p-3 rounded-xl bg-[#111513] border border-[#57EF40]/30 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-[#57EF40]">
                    <span>Link de Convite Gerado:</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(lastGeneratedInviteUrl)}
                      className="text-xs hover:underline flex items-center gap-1"
                    >
                      {copiedToken === 'last-generated' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedToken === 'last-generated' ? 'Copiado!' : 'Copiar'}</span>
                    </button>
                  </div>
                  <input
                    readOnly
                    value={lastGeneratedInviteUrl}
                    className="w-full px-2 py-1 rounded bg-[#0c0f0d] border border-[#222924] text-[10px] text-gray-300 font-mono"
                  />
                </div>
              )}

              <div className="pt-3 border-t border-[#222924] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#18201C] hover:bg-[#202B25] text-xs font-semibold text-white border border-[#222924]"
                >
                  Fechar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingInvite}
                  className="px-4 py-2 rounded-xl bg-[#57EF40] hover:bg-[#65C556] text-[#070908] font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmittingInvite ? 'Gerando Link...' : 'Gerar Convite'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar Função/Role */}
      {isEditRoleOpen && selectedUserForRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm bg-[#0c0f0d] border border-[#222924] rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#222924]">
              <h4 className="text-xs font-bold text-white">Alterar Função de {selectedUserForRole.name}</h4>
              <button
                type="button"
                onClick={() => setIsEditRoleOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold text-gray-300 block">Novo Perfil de Acesso</label>
              <select
                value={newRoleValue}
                onChange={(e) => setNewRoleValue(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#111513] border border-[#222924] text-xs text-white focus:outline-none focus:border-[#57EF40]"
              >
                <option value="SALES_REP">Vendas & SDR (Sales Rep)</option>
                <option value="STOCK_OPERATOR">Operador de Estoque</option>
                <option value="FINANCIAL">Financeiro</option>
                <option value="ADMIN">Administrador</option>
                <option value="OWNER">Proprietário (Owner)</option>
              </select>
            </div>

            <div className="pt-3 border-t border-[#222924] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditRoleOpen(false)}
                className="px-3 py-1.5 rounded-xl bg-[#18201C] text-xs text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isSavingRole}
                onClick={handleSaveRole}
                className="px-4 py-1.5 rounded-xl bg-[#57EF40] text-[#070908] font-bold text-xs"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Reatribuir Carteira de Clientes */}
      {isReassignOpen && fromUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-[#0c0f0d] border border-[#222924] rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#222924]">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-amber-400" />
                <h4 className="text-xs font-bold text-white">Reatribuir Carteira de Clientes</h4>
              </div>
              <button
                type="button"
                onClick={() => setIsReassignOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Transfira todos os leads, contatos e pedidos vinculados a <strong>{fromUser.name}</strong> para outro operador da equipe.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-300 block">
                Operador de Destino *
              </label>
              <select
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#111513] border border-[#222924] text-xs text-white focus:outline-none focus:border-[#57EF40]"
              >
                <option value="">Selecione um operador...</option>
                {users
                  .filter(u => u.id !== fromUser.id && u.isActive !== false)
                  .map(target => (
                    <option key={target.id} value={target.id}>
                      {target.name} ({USER_ROLE_LABELS[target.role] || target.role})
                    </option>
                  ))}
              </select>
            </div>

            <div className="pt-3 border-t border-[#222924] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsReassignOpen(false)}
                className="px-3 py-1.5 rounded-xl bg-[#18201C] text-xs text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!targetUserId || isReassigning}
                onClick={handleReassign}
                className="px-4 py-1.5 rounded-xl bg-[#57EF40] text-[#070908] font-bold text-xs disabled:opacity-50"
              >
                {isReassigning ? 'Reatribuindo...' : 'Confirmar Transferência'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Plan Modal */}
      <UpgradePlanModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        currentPlan={upgradeData.plan}
        currentCount={upgradeData.current}
        limit={upgradeData.limit}
      />
    </div>
  );
}
