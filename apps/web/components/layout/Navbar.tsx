'use client';

import React, { useEffect, useState } from 'react';
import { Phone, Bell, Bot, Sparkles, Radio, PhoneCall, Building2, ShieldAlert, LogOut, Crown } from 'lucide-react';
import { useSoftphoneStore } from '../../stores/useSoftphoneStore';
import { Button } from '../ui/Button';
import { useRouter } from 'next/navigation';

export function Navbar() {
  const router = useRouter();
  const { toggleOpen, status, callDuration } = useSoftphoneStore();
  const [workspaceName, setWorkspaceName] = useState('CRDISK Enterprise');
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [userRole, setUserRole] = useState<string | null>('superadmin');
  const [userName, setUserName] = useState('Master Admin');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedWorkspace = localStorage.getItem('crdisk_active_workspace_name');
      const impersonating = localStorage.getItem('crdisk_impersonating');
      const role = localStorage.getItem('crdisk_user_role');
      const name = localStorage.getItem('crdisk_user_name');

      if (storedWorkspace) setWorkspaceName(storedWorkspace);
      if (impersonating === 'true') setIsImpersonating(true);
      if (role) setUserRole(role);
      if (name) setUserName(name);
    }
  }, []);

  const handleExitImpersonation = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('crdisk_impersonating');
      localStorage.setItem('crdisk_active_workspace_id', '11111111-1111-1111-1111-111111111111');
      localStorage.setItem('crdisk_active_workspace_name', 'CRDISK Enterprise');
    }
    setIsImpersonating(false);
    router.push('/admin');
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.warn('Logout error:', e);
    }
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
    router.push('/login');
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {/* Impersonation Warning Banner */}
      {isImpersonating && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 text-amber-300 px-6 py-2 flex items-center justify-between text-xs z-50 animate-in fade-in">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>
              <strong>Modo de Suporte Super Admin Ativo:</strong> Você está acessando os dados como Administrador do Workspace <span className="underline font-bold text-white">{workspaceName}</span>.
            </span>
          </div>
          <button
            onClick={handleExitImpersonation}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Encerrar Modo de Suporte
          </button>
        </div>
      )}

      <header className="h-16 border-b border-[#222924] bg-[#0c0f0d]/90 backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-40">
        {/* Brand Logo & Platform Title */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            {/* CRDISK Logo Mark */}
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#57EF40] to-[#65C556] flex items-center justify-center text-[#070908] font-black text-sm tracking-tighter shadow-sm">
              CR
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-tight text-foreground flex items-center gap-2">
                <span>CRDISK</span>
                <span className="text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded-full bg-[#18201C] text-muted-foreground border border-[#222924] uppercase flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-[#57EF40]" />
                  {workspaceName}
                </span>
              </h1>
              <p className="text-[11px] text-muted-foreground font-medium">Gestão Comercial & Atendimento</p>
            </div>
          </div>
        </div>

        {/* Center / Right Action Bar */}
        <div className="flex items-center gap-3">
          {/* Softphone Floating Quick Trigger */}
          <button
            onClick={toggleOpen}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-semibold text-xs transition-all ${
              status === 'IN_CALL'
                ? 'bg-[#57EF40]/15 text-[#57EF40] border border-[#57EF40]/40 animate-pulse'
                : status === 'RINGING' || status === 'DIALING'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-bounce'
                : 'bg-[#18201C] hover:bg-[#202B25] text-foreground border border-[#222924] hover:border-[#333E37]'
            }`}
          >
            <Phone className={`w-3.5 h-3.5 ${status === 'IN_CALL' ? 'text-[#57EF40] animate-pulse' : 'text-[#57EF40]'}`} />
            {status === 'IN_CALL' ? (
              <span className="font-mono text-[#57EF40]">Em Chamada ({formatTimer(callDuration)})</span>
            ) : status === 'RINGING' ? (
              <span>Chamando...</span>
            ) : (
              <span>Central de Ligações</span>
            )}
          </button>

          {/* AI Agent Status Pill with Discrete Green Dot */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#18201C] border border-[#222924] text-xs text-foreground">
            <span className="relative flex h-2 w-2">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#57EF40]"></span>
            </span>
            <span className="text-muted-foreground text-[11px]">Assistente IA:</span>
            <strong className="text-foreground text-[11px] font-semibold">Sofia (Ativa)</strong>
          </div>

          {/* Notification Bell */}
          <button className="w-8 h-8 rounded-xl bg-[#18201C] hover:bg-[#202B25] border border-[#222924] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors relative">
            <Bell className="w-3.5 h-3.5" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#57EF40] absolute top-2 right-2 ring-2 ring-[#0c0f0d]" />
          </button>

          {/* User Profile & Logout */}
          <div className="flex items-center gap-2.5 pl-3 border-l border-[#222924]">
            <div className="w-8 h-8 rounded-xl bg-[#18201C] border border-[#222924] flex items-center justify-center text-white font-bold text-xs">
              {userName.slice(0, 2).toUpperCase()}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-bold text-foreground leading-none flex items-center gap-1.5">
                {userName}
                {userRole === 'superadmin' && <Crown className="w-3 h-3 text-purple-400" />}
              </p>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#57EF40]"></span>
                {userRole === 'superadmin' ? 'Super Admin' : userRole === 'workspace_admin' ? 'Admin Workspace' : 'Operador'}
              </p>
            </div>

            {/* Logout Action Button */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-[#18201C] hover:bg-rose-500/10 text-muted-foreground hover:text-rose-400 border border-[#222924] hover:border-rose-500/30 transition-all ml-1 cursor-pointer"
              title="Encerrar Sessão (Logout)"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
