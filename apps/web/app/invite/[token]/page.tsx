'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Users, 
  Lock, 
  User, 
  Mail, 
  Building2, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { api } from '../../../lib/api';
import { USER_ROLE_LABELS, UserRole } from '@omnicrm/shared';

export default function AcceptInvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = typeof params?.token === 'string' ? params.token : '';

  const [isLoading, setIsLoading] = useState(true);
  const [inviteData, setInviteData] = useState<any>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successRedirect, setSuccessRedirect] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoadError('Token de convite não informado.');
      setIsLoading(false);
      return;
    }

    const validateToken = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const data = await api.getPublicInvite(token);
        setInviteData(data);
        if (data.name) setName(data.name);
      } catch (err: any) {
        setLoadError(err.message || 'Convite inválido, expirado ou já utilizado.');
      } finally {
        setIsLoading(false);
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!name.trim()) {
      setSubmitError('Por favor, informe seu nome completo.');
      return;
    }

    if (!password || password.length < 6) {
      setSubmitError('A senha deve conter no mínimo 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setSubmitError('As senhas digitadas não coincidem.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.acceptPublicInvite(token, {
        name: name.trim(),
        password
      });

      // Save user session in localStorage and cookie
      if (typeof window !== 'undefined') {
        if (res.token) {
          localStorage.setItem('crdisk_token', res.token);
          // Set edge session cookie as well
          document.cookie = `crdisk_token=${res.token}; path=/; max-age=2592000; SameSite=Lax`;
          document.cookie = `crdisk_session=${res.token}; path=/; max-age=2592000; SameSite=Lax`;
        }
        if (res.user?.role) {
          localStorage.setItem('crdisk_user_role', res.user.role);
        }
        if (res.user?.name) {
          localStorage.setItem('crdisk_user_name', res.user.name);
        }
        if (res.user?.id) {
          localStorage.setItem('crdisk_user_id', res.user.id);
        }
        if (res.user?.workspaceId) {
          localStorage.setItem('crdisk_active_workspace_id', res.user.workspaceId);
        }
        if (res.workspace?.name) {
          localStorage.setItem('crdisk_active_workspace_name', res.workspace.name);
        }
      }

      setSuccessRedirect(true);
      setTimeout(() => {
        router.push('/crm');
      }, 1200);
    } catch (err: any) {
      setSubmitError(err.message || 'Falha ao aceitar o convite. Tente novamente.');
      setIsSubmitting(false);
    }
  };

  const getRoleLabel = (role: string) => {
    return USER_ROLE_LABELS[role as UserRole] || role;
  };

  return (
    <div className="min-h-screen bg-[#070908] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-[#57EF40]/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-950/20 blur-[100px] rounded-full pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#111513] border border-[#1F2621] text-xs font-mono text-[#57EF40] mb-3 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>CRDISK ENTERPRISE • CONVITE DE EQUIPE</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Ativação de Conta
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Plataforma Omnichannel & Gestão Comercial
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="p-8 rounded-3xl bg-[#111513] border border-[#1F2621] text-center space-y-4 shadow-2xl">
            <RefreshCw className="w-8 h-8 text-[#57EF40] animate-spin mx-auto" />
            <p className="text-sm text-gray-300 font-medium">Validando token de convite seguro...</p>
          </div>
        )}

        {/* Error / Expired State */}
        {!isLoading && loadError && (
          <div className="p-8 rounded-3xl bg-[#111513] border border-rose-500/30 text-center space-y-5 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Convite Não Encontrado</h2>
              <p className="text-xs text-rose-300/80 mt-1.5 leading-relaxed">
                {loadError}
              </p>
            </div>
            <button
              onClick={() => router.push('/login')}
              className="w-full py-3 rounded-xl bg-[#18201C] hover:bg-[#202c24] text-white text-xs font-bold border border-[#26332B] transition-colors"
            >
              Ir para tela de Login
            </button>
          </div>
        )}

        {/* Success / Accept Form */}
        {!isLoading && !loadError && inviteData && (
          <div className="p-8 rounded-3xl bg-[#111513] border border-[#1F2621] shadow-2xl space-y-6">
            {/* Workspace & Role Invitation Banner */}
            <div className="p-4 rounded-2xl bg-[#161C18] border border-[#222B25] space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
                <Building2 className="w-4 h-4 text-[#57EF40]" />
                <span>Você foi convidado para a equipe:</span>
              </div>
              <div className="text-base font-extrabold text-white">
                {inviteData.workspaceName || 'Equipe CRDISK'}
              </div>

              <div className="pt-2 border-t border-[#222B25] flex items-center justify-between">
                <span className="text-[11px] text-gray-400">Papel / Função:</span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#57EF40]/10 text-[#57EF40] border border-[#57EF40]/30 font-mono">
                  {getRoleLabel(inviteData.role)}
                </span>
              </div>
            </div>

            {submitError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {successRedirect ? (
              <div className="p-6 rounded-2xl bg-[#18201C] border border-[#57EF40]/40 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-[#57EF40] mx-auto animate-bounce" />
                <h3 className="text-sm font-bold text-white">Acesso ativado com sucesso!</h3>
                <p className="text-xs text-gray-400">Redirecionando para o Funil de Vendas (/crm)...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Read-only */}
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 mb-1.5">
                    E-mail Corporativo
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      value={inviteData.email || ''}
                      disabled
                      className="w-full bg-[#161C18] border border-[#222B25] rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-400 cursor-not-allowed font-medium"
                    />
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-[11px] font-semibold text-gray-300 mb-1.5">
                    Nome Completo <span className="text-[#57EF40]">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      placeholder="Ex: Carlos Eduardo Silveira"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-[#18201C] border border-[#222B25] focus:border-[#57EF40] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-gray-600 outline-none transition-all font-medium"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-[11px] font-semibold text-gray-300 mb-1.5">
                    Criar Senha de Acesso <span className="text-[#57EF40]">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-[#18201C] border border-[#222B25] focus:border-[#57EF40] rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder:text-gray-600 outline-none transition-all font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-gray-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-[11px] font-semibold text-gray-300 mb-1.5">
                    Confirmar Senha <span className="text-[#57EF40]">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Repita sua senha"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-[#18201C] border border-[#222B25] focus:border-[#57EF40] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-gray-600 outline-none transition-all font-medium"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 py-3.5 rounded-xl bg-gradient-to-r from-[#57EF40] to-[#65C556] hover:opacity-95 text-[#070908] text-xs font-black tracking-wide shadow-glow-green active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-[#070908]" />
                      <span>Ativando Credenciais...</span>
                    </>
                  ) : (
                    <>
                      <span>Ativar Acesso & Entrar no CRDISK</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            <div className="pt-2 text-center text-[10px] text-gray-500 flex items-center justify-center gap-1.5 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-[#57EF40]" />
              <span>Ambiente criptografado CRDISK Security • SSL 256-bit</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
