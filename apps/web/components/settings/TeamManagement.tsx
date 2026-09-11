'use client';

import React, { useState, useEffect } from 'react';
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
  X
} from 'lucide-react';
import { api } from '../../lib/api';
import { Button } from '../ui/Button';

interface TeamUser {
  id: string;
  name: string;
  email: string;
  role: 'superadmin' | 'workspace_admin' | 'operator';
  workspaceId: string;
  status: 'active' | 'inactive';
  createdAt?: string;
}

export function TeamManagement() {
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'workspace_admin' | 'operator'>('all');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isAccessDenied, setIsAccessDenied] = useState(false);

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<TeamUser | null>(null);

  // Form States
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'workspace_admin' | 'operator'>('operator');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit / Reset States
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<'workspace_admin' | 'operator'>('operator');
  const [resetPasswordVal, setResetPasswordVal] = useState('');

  useEffect(() => {
    loadTeamMembers();
  }, []);

  const loadTeamMembers = async () => {
    setIsLoading(true);
    setFeedback(null);
    try {
      const res = await api.getTeamMembers();
      if (res && res.users) {
        setUsers(res.users);
      } else if (Array.isArray(res)) {
        setUsers(res);
      }
      setIsAccessDenied(false);
    } catch (err: any) {
      if (err.message && (err.message.includes('403') || err.message.includes('Acesso negado') || err.message.includes('Forbidden'))) {
        setIsAccessDenied(true);
      } else {
        setFeedback({ type: 'error', message: err.message || 'Erro ao carregar membros da equipe.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) {
      setFeedback({ type: 'error', message: 'Preencha todos os campos obrigatórios.' });
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createTeamMember({
        name: newName.trim(),
        email: newEmail.trim(),
        password: newPassword,
        role: newRole
      });

      setFeedback({ type: 'success', message: `Membro ${newName} cadastrado com sucesso!` });
      setIsCreateModalOpen(false);
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      setNewRole('operator');
      await loadTeamMembers();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erro ao cadastrar membro.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setIsSubmitting(true);
    try {
      await api.updateTeamMember(selectedUser.id, {
        name: editName.trim(),
        role: editRole
      });

      setFeedback({ type: 'success', message: `Dados de ${editName} atualizados com sucesso!` });
      setIsEditModalOpen(false);
      setSelectedUser(null);
      await loadTeamMembers();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erro ao atualizar usuário.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !resetPasswordVal.trim()) return;

    setIsSubmitting(true);
    try {
      await api.resetTeamMemberPassword(selectedUser.id, resetPasswordVal.trim());
      setFeedback({ type: 'success', message: `Senha de ${selectedUser.name} redefinida com sucesso!` });
      setIsResetModalOpen(false);
      setSelectedUser(null);
      setResetPasswordVal('');
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erro ao redefinir senha.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (user: TeamUser) => {
    if (!confirm(`Tem certeza que deseja remover ${user.name} da equipe deste Workspace?`)) return;

    try {
      await api.deleteTeamMember(user.id);
      setFeedback({ type: 'success', message: `Membro ${user.name} removido com sucesso.` });
      await loadTeamMembers();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erro ao remover usuário.' });
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || 
                          u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (isAccessDenied) {
    return (
      <div className="bg-[#111513] border border-[#222924] rounded-2xl p-8 text-center max-w-xl mx-auto my-8">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4 text-red-400">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Acesso Restrito ao Gestor</h3>
        <p className="text-gray-400 text-sm mb-6 leading-relaxed">
          Seu perfil atual de <span className="text-emerald-400 font-semibold">Operador</span> não possui permissão para gerenciar os membros da equipe. Entre em contato com o Administrador do seu Workspace.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#111513] border border-[#222924] rounded-2xl p-6 relative overflow-hidden shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-[#18201C] border border-[#222924] flex items-center justify-center text-[#57EF40]">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Gestão da Equipe & Níveis de Acesso</h2>
                <p className="text-sm text-gray-400">
                  Cadastre novos atendentes, defina permissões de administrador e controle o acesso ao CRM.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={loadTeamMembers}
              disabled={isLoading}
              className="border-[#222924] bg-[#18201C] hover:bg-[#202B25] text-gray-300"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin text-[#57EF40]' : ''}`} />
              Atualizar
            </Button>

            <Button
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-[#57EF40] hover:bg-[#65C556] text-black font-semibold shadow-lg shadow-[#57EF40]/20"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Adicionar Usuário
            </Button>
          </div>
        </div>
      </div>

      {/* Alert Notifications */}
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

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por nome ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#111513] border border-[#222924] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#57EF40] transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setRoleFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              roleFilter === 'all' 
                ? 'bg-[#18201C] text-white border border-[#222924] font-bold' 
                : 'bg-[#111513] text-gray-400 border border-[#222924] hover:text-white'
            }`}
          >
            Todos ({users.length})
          </button>
          <button
            onClick={() => setRoleFilter('workspace_admin')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              roleFilter === 'workspace_admin' 
                ? 'bg-[#18201C] text-white border border-[#222924] font-bold' 
                : 'bg-[#111513] text-gray-400 border border-[#222924] hover:text-white'
            }`}
          >
            Administradores ({users.filter(u => u.role === 'workspace_admin' || u.role === 'superadmin').length})
          </button>
          <button
            onClick={() => setRoleFilter('operator')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              roleFilter === 'operator' 
                ? 'bg-[#18201C] text-white border border-[#222924] font-bold' 
                : 'bg-[#111513] text-gray-400 border border-[#222924] hover:text-white'
            }`}
          >
            Operadores ({users.filter(u => u.role === 'operator').length})
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#111513] border border-[#222924] rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-[#18201C] border-b border-[#222924] text-gray-400 text-xs font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-6">Membro</th>
                <th className="py-3.5 px-6">Função & Permissão</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222924]">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-gray-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#57EF40]" />
                    Carregando membros da equipe...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-gray-500">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    Nenhum membro encontrado com os filtros atuais.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isSuper = user.role === 'superadmin';
                  const isAdmin = user.role === 'workspace_admin';
                  const isOperator = user.role === 'operator';

                  return (
                    <tr key={user.id} className="hover:bg-[#18201C]/50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#18201C] border border-[#222924] flex items-center justify-center font-bold text-white text-sm">
                            {user.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-white flex items-center gap-2">
                              {user.name}
                              {isSuper && (
                                <span className="text-[10px] bg-purple-500/20 text-purple-400 border border-purple-500/30 px-1.5 py-0.5 rounded font-mono">
                                  CRDISK MASTER
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-400">{user.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        {isAdmin ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#57EF40]/10 text-[#57EF40] border border-[#57EF40]/30">
                            <Shield className="w-3.5 h-3.5" />
                            Admin Workspace
                          </div>
                        ) : isSuper ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/30">
                            <Shield className="w-3.5 h-3.5" />
                            Super Admin
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                            <Headphones className="w-3.5 h-3.5" />
                            Operador Atendimento
                          </div>
                        )}
                        <p className="text-[11px] text-gray-500 mt-1">
                          {isAdmin 
                            ? 'Acesso total a CRM, Chat, Discador e Configurações' 
                            : isSuper 
                            ? 'Acesso irrestrito a todos os Workspaces' 
                            : 'Acesso operacional ao CRM, Chat Live e Discador'}
                        </p>
                      </td>

                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.status === 'active' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                          {user.status === 'active' ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            title="Editar Dados"
                            onClick={() => {
                              setSelectedUser(user);
                              setEditName(user.name);
                              setEditRole(user.role === 'workspace_admin' ? 'workspace_admin' : 'operator');
                              setIsEditModalOpen(true);
                            }}
                            className="p-2 rounded-lg bg-[#18201C] hover:bg-[#202B25] text-gray-300 hover:text-white border border-[#222924] transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            title="Redefinir Senha"
                            onClick={() => {
                              setSelectedUser(user);
                              setResetPasswordVal('');
                              setIsResetModalOpen(true);
                            }}
                            className="p-2 rounded-lg bg-[#18201C] hover:bg-[#202B25] text-gray-300 hover:text-white border border-[#222924] transition-colors"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>

                          {!isSuper && (
                            <button
                              title="Remover Usuário"
                              onClick={() => handleDeleteUser(user)}
                              className="p-2 rounded-lg bg-[#18201C] hover:bg-red-950/40 text-gray-400 hover:text-red-400 border border-[#222924] hover:border-red-800/40 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
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

      {/* Modal: Adicionar Novo Usuário */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111513] border border-[#222924] rounded-2xl w-full max-w-md p-6 relative shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2 text-white font-bold text-lg">
                <UserPlus className="w-5 h-5 text-[#57EF40]" />
                Adicionar Novo Usuário
              </div>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-400 hover:text-white text-sm p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Nome Completo <span className="text-[#57EF40]">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    required
                    placeholder="Ex: Amanda Silva"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-[#18201C] border border-[#222924] rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-[#57EF40]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  E-mail Corporativo <span className="text-[#57EF40]">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="email"
                    required
                    placeholder="amanda@empresa.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full bg-[#18201C] border border-[#222924] rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-[#57EF40]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Senha Inicial de Acesso <span className="text-[#57EF40]">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="password"
                    required
                    placeholder="Mínimo de 6 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-[#18201C] border border-[#222924] rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-[#57EF40]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Nível de Acesso (Role) <span className="text-[#57EF40]">*</span>
                </label>
                <select
                  value={newRole}
                  onChange={(e: any) => setNewRole(e.target.value)}
                  className="w-full bg-[#18201C] border border-[#222924] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#57EF40]"
                >
                  <option value="operator">Operador de Atendimento (Acesso CRM, Chat e Discador)</option>
                  <option value="workspace_admin">Administrador do Workspace (Acesso Total + Gestão de Equipe)</option>
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#222924]">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="border-[#222924] bg-[#18201C] text-gray-300"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting}
                  className="bg-[#57EF40] hover:bg-[#65C556] text-black font-semibold"
                >
                  {isSubmitting ? 'Salvando...' : 'Cadastrar Membro'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar Membro */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111513] border border-[#222924] rounded-2xl w-full max-w-md p-6 relative shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2 text-white font-bold text-lg">
                <Edit2 className="w-5 h-5 text-[#57EF40]" />
                Editar Membro da Equipe
              </div>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 hover:text-white text-sm p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-[#18201C] border border-[#222924] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#57EF40]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">E-mail (fixo)</label>
                <input
                  type="email"
                  disabled
                  value={selectedUser.email}
                  className="w-full bg-[#18201C]/50 border border-[#222924] rounded-xl px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Nível de Permissão</label>
                <select
                  value={editRole}
                  onChange={(e: any) => setEditRole(e.target.value)}
                  className="w-full bg-[#18201C] border border-[#222924] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#57EF40]"
                >
                  <option value="operator">Operador de Atendimento</option>
                  <option value="workspace_admin">Administrador do Workspace</option>
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#222924]">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditModalOpen(false)}
                  className="border-[#222924] bg-[#18201C] text-gray-300"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting}
                  className="bg-[#57EF40] hover:bg-[#65C556] text-black font-semibold"
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Redefinir Senha */}
      {isResetModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111513] border border-[#222924] rounded-2xl w-full max-w-md p-6 relative shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2 text-white font-bold text-lg">
                <KeyRound className="w-5 h-5 text-[#57EF40]" />
                Redefinir Senha do Usuário
              </div>
              <button 
                onClick={() => setIsResetModalOpen(false)}
                className="text-gray-400 hover:text-white text-sm p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-gray-400 mb-4">
              Defina uma nova senha de acesso para <strong className="text-white">{selectedUser.name}</strong> ({selectedUser.email}).
            </p>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Nova Senha</label>
                <input
                  type="password"
                  required
                  placeholder="Mínimo 6 caracteres"
                  value={resetPasswordVal}
                  onChange={(e) => setResetPasswordVal(e.target.value)}
                  className="w-full bg-[#18201C] border border-[#222924] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#57EF40]"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#222924]">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsResetModalOpen(false)}
                  className="border-[#222924] bg-[#18201C] text-gray-300"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting || !resetPasswordVal.trim()}
                  className="bg-[#57EF40] hover:bg-[#65C556] text-black font-semibold"
                >
                  {isSubmitting ? 'Salvando...' : 'Confirmar Nova Senha'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
