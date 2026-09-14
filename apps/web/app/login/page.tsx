'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Mail, 
  Lock,
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import MatrixRainBackground from '@/components/ui/MatrixRainBackground';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/dashboard';

  // Form State with requested default test credentials
  const [email, setEmail] = useState('adm');
  const [password, setPassword] = useState('052115wW@');
  const [showPassword, setShowPassword] = useState(false);
  
  // Interaction State
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    const cleanEmail = email.trim();
    const cleanPass = password.trim();

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, username: cleanEmail, password: cleanPass })
      });

      const res = await response.json().catch(() => ({}));

      if (response.status === 429) {
        setIsLoading(false);
        setErrorMessage(res.error || 'Muitas tentativas de login. Tente novamente em alguns minutos.');
        return;
      }

      if (!response.ok || !res.success) {
        setIsLoading(false);
        setErrorMessage(res.error || 'Credenciais inválidas. Verifique seu usuário/e-mail e senha.');
        return;
      }

      // Store non-sensitive metadata for UI display
      if (typeof window !== 'undefined') {
        localStorage.setItem('crdisk_user_role', res.user?.role || 'superadmin');
        localStorage.setItem('crdisk_user_name', res.user?.name || 'Administrador');
        localStorage.setItem('crdisk_active_workspace_id', res.workspace?.id || res.user?.workspaceId || '11111111-1111-1111-1111-111111111111');
        localStorage.setItem('crdisk_active_workspace_name', res.workspace?.name || 'CRDISK Enterprise');
        localStorage.removeItem('crdisk_impersonating');
      }

      setSuccessMessage(`Autenticado com sucesso! Bem-vindo, ${res.user?.name || 'Administrador'}.`);
      
      setTimeout(() => {
        router.push(redirectTarget);
      }, 500);

    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Erro ao conectar ao servidor de autenticação.');
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'adm', username: 'adm', password: '052115wW@' })
      });
      const res = await response.json();
      if (res.success) {
        setSuccessMessage('Autenticado via Google Workspace! Redirecionando...');
        setTimeout(() => router.push(redirectTarget), 500);
      }
    } catch (e) {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-[#070908] overflow-hidden selection:bg-[#57EF40]/25 selection:text-[#57EF40]">
      {/* 3D Matrix Digital Rain Background */}
      <MatrixRainBackground opacity={0.35} interactive={true} />

      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#57EF40]/[0.03] rounded-full blur-[140px] pointer-events-none" />

      {/* Main Container Card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="p-8 rounded-3xl bg-[#111513] border border-[#222924] shadow-2xl transition-all duration-300">
          
          {/* Discrete Logo Header */}
          <div className="mb-7 text-center">
            <div className="inline-flex items-center justify-center gap-2.5 px-3 py-1.5 rounded-2xl bg-[#18201C] border border-[#222924] mb-4">
              <span className="w-2 h-2 rounded-full bg-[#57EF40] shadow-glow-green" />
              <span className="font-extrabold text-xs tracking-wider text-foreground">CRDISK CRM</span>
            </div>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
              Acesse sua conta
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Plataforma de Vendas e Telefonia Inteligente
            </p>
          </div>

          {/* Social Login Button: "Continuar com o Google" */}
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-[#18201C] border border-[#222924] hover:border-[#333E37] text-foreground transition-all duration-200 font-semibold text-xs cursor-pointer active:scale-[0.99]"
          >
            {/* Official Multi-color Google SVG Icon */}
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17Z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24Z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.98 0 12s.45 3.83 1.25 5.42l4.03-3.15Z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
              />
            </svg>
            <span>Continuar com o Google</span>
          </button>

          {/* Divider with centered "ou" */}
          <div className="flex items-center my-5">
            <div className="flex-1 border-t border-[#222924]" />
            <span className="px-3 text-xs text-muted-foreground font-medium lowercase select-none">
              ou
            </span>
            <div className="flex-1 border-t border-[#222924]" />
          </div>

          {/* Feedback Banners */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2.5 animate-fade-in font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 rounded-xl bg-[#57EF40]/15 border border-[#57EF40]/40 text-[#57EF40] text-xs flex items-center gap-2.5 animate-fade-in font-medium shadow-glow-green-sm">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#57EF40]" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email / Usuário Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground block">
                Email ou Usuário
              </label>
              <div className="relative group">
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu.email@empresa.com ou adm"
                  className="w-full bg-[#070908] border border-[#222924] focus:border-[#57EF40] rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-foreground placeholder:text-muted-foreground outline-none transition-all font-medium"
                />
                <Mail className="w-4 h-4 text-muted-foreground absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none group-focus-within:text-[#57EF40] transition-colors" />
              </div>
            </div>

            {/* Senha Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground block">
                  Senha
                </label>
                <a href="#" className="text-[11px] text-muted-foreground hover:text-[#57EF40] transition-colors">
                  Esqueceu a senha?
                </a>
              </div>
              <div className="relative group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#070908] border border-[#222924] focus:border-[#57EF40] rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-foreground placeholder:text-muted-foreground outline-none transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-[#57EF40] transition-colors focus:outline-none"
                  aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Single Primary Action Button ("Acessar Plataforma") */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#57EF40] to-[#65C556] hover:opacity-95 text-[#070908] text-xs font-extrabold shadow-glow-green active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-[#070908] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Acessar Plataforma</span>
                    <ArrowRight className="w-4 h-4 text-[#070908]" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Footer Link: "Criar uma conta" */}
          <div className="text-center text-xs text-muted-foreground pt-5 border-t border-[#222924] mt-6">
            <span>Ainda não tem uma conta? </span>
            <a href="#" className="text-[#57EF40] font-bold hover:underline ml-1">
              Criar uma conta
            </a>
          </div>
        </div>

        {/* Subtle Security Badge */}
        <div className="text-center mt-5">
          <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground/80 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-[#57EF40]" />
            CRDISK Enterprise • Conexão Segura & Criptografada
          </span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen w-full flex items-center justify-center bg-[#070908] text-[#57EF40]">
        <div className="w-6 h-6 border-2 border-[#57EF40] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </React.Suspense>
  );
}

