'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Building2, 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  ShieldCheck,
  Zap
} from 'lucide-react';
import MatrixRainBackground from '@/components/ui/MatrixRainBackground';

const PLANS = [
  {
    id: 'basic',
    name: 'Básico',
    price: 'R$ 147/mês',
    description: '1 Operador • WhatsApp • CRM Kanban'
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 'R$ 297/mês',
    badge: 'Recomendado',
    description: '3 Operadores • Discador Power • Sofia IA'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'R$ 597/mês',
    description: 'Ilimitado • Tronco SIP • Múltiplos Agentes'
  }
];

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPlan = searchParams.get('plan') || 'pro';

  const [companyName, setCompanyName] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(initialPlan);
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: companyName.trim(),
          name: name.trim(),
          email: email.trim(),
          password: password.trim(),
          plan: selectedPlan
        })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        setIsLoading(false);
        setErrorMessage(data.error || 'Erro ao criar conta. Verifique os dados informados.');
        return;
      }

      setSuccessMessage('Conta criada com sucesso! Redirecionando para o seu painel...');
      setTimeout(() => {
        router.push('/dashboard');
      }, 1200);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Erro de conexão com o servidor.');
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-[#070908] overflow-hidden selection:bg-[#57EF40]/25 selection:text-[#57EF40]">
      {/* 3D Matrix Digital Rain Background */}
      <MatrixRainBackground opacity={0.35} interactive={true} />

      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#57EF40]/[0.03] rounded-full blur-[140px] pointer-events-none" />

      {/* Main Container Card */}
      <div className="relative z-10 w-full max-w-lg">
        <div className="p-8 sm:p-10 rounded-3xl bg-[#111513] border border-[#222924] shadow-2xl transition-all duration-300">
          
          {/* Header */}
          <div className="mb-7 text-center">
            <Link href="/" className="inline-flex items-center justify-center gap-2.5 px-3 py-1.5 rounded-2xl bg-[#18201C] border border-[#222924] mb-4 hover:border-[#57EF40]/50 transition-colors">
              <span className="w-2 h-2 rounded-full bg-[#57EF40] shadow-glow-green" />
              <span className="font-extrabold text-xs tracking-wider text-foreground">CRDISK 2.0</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Comece seu teste grátis
            </h1>
            <p className="text-xs text-muted-foreground mt-1.5 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#57EF40]" />
              <span>7 dias de acesso total • Sem necessidade de cartão agora</span>
            </p>
          </div>

          {/* Plan Selector */}
          <div className="mb-6 space-y-2">
            <label className="text-xs font-bold text-foreground block">
              Escolha seu plano:
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {PLANS.map((p) => {
                const isSelected = selectedPlan === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPlan(p.id)}
                    className={`p-3 rounded-2xl border text-left transition-all relative ${
                      isSelected 
                        ? 'border-[#57EF40] bg-[#57EF40]/10 text-white shadow-glow-green-sm' 
                        : 'border-[#222924] bg-[#18201C]/60 text-muted-foreground hover:border-[#333E37]'
                    }`}
                  >
                    {p.badge && (
                      <span className="absolute -top-2 right-2 px-1.5 py-0.5 rounded-full bg-[#57EF40] text-[#070908] text-[9px] font-black uppercase tracking-wider">
                        {p.badge}
                      </span>
                    )}
                    <div className="font-extrabold text-xs text-white">{p.name}</div>
                    <div className="text-[11px] text-[#57EF40] font-semibold mt-0.5">{p.price}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Feedback Messages */}
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

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Company Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground block">
                Nome da Empresa
              </label>
              <div className="relative">
                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  required
                  placeholder="Ex: Minha Operação Comercial"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#18201C] border border-[#222924] focus:border-[#57EF40] focus:ring-1 focus:ring-[#57EF40] text-foreground text-xs placeholder:text-muted-foreground/60 transition-all outline-none"
                />
              </div>
            </div>

            {/* Admin Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground block">
                Seu Nome Completo
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Silva"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#18201C] border border-[#222924] focus:border-[#57EF40] focus:ring-1 focus:ring-[#57EF40] text-foreground text-xs placeholder:text-muted-foreground/60 transition-all outline-none"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground block">
                E-mail Profissional
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  required
                  placeholder="carlos@empresa.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#18201C] border border-[#222924] focus:border-[#57EF40] focus:ring-1 focus:ring-[#57EF40] text-foreground text-xs placeholder:text-muted-foreground/60 transition-all outline-none"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground block">
                Criar Senha de Acesso
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#18201C] border border-[#222924] focus:border-[#57EF40] focus:ring-1 focus:ring-[#57EF40] text-foreground text-xs placeholder:text-muted-foreground/60 transition-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#57EF40] to-[#40C82B] text-[#070908] text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-glow-green hover:shadow-glow-green-lg active:scale-[0.99] transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-[#070908] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Ativar Período de Teste Gratuito</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Footer Navigation */}
          <div className="mt-7 pt-5 border-t border-[#222924] text-center">
            <p className="text-xs text-muted-foreground">
              Já tem uma conta cadastrada?{' '}
              <Link href="/login" className="text-[#57EF40] font-bold hover:underline">
                Fazer login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070908]" />}>
      <RegisterContent />
    </Suspense>
  );
}
