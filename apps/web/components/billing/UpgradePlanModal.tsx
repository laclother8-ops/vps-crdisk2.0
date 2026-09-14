'use client';

import React from 'react';
import { 
  X, 
  Crown, 
  Zap, 
  Check, 
  ArrowRight, 
  Users, 
  ShieldCheck, 
  Sparkles 
} from 'lucide-react';
import Link from 'next/link';

interface UpgradePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan?: string;
  currentCount?: number;
  limit?: number;
}

export function UpgradePlanModal({
  isOpen,
  onClose,
  currentPlan = 'starter',
  currentCount = 1,
  limit = 1
}: UpgradePlanModalProps) {
  if (!isOpen) return null;

  const planName = currentPlan.toUpperCase();
  const nextPlanName = currentPlan.toLowerCase() === 'starter' ? 'PRO (3 Operadores)' : 'ENTERPRISE (Ilimitado)';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-[#0c0f0d] border border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-500 via-[#57EF40] to-amber-500" />

        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-[#222924] flex items-center justify-between bg-[#111513]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                Teto de Integrantes Atingido
              </h3>
              <span className="text-[11px] text-amber-400 font-mono font-bold">
                Plano {planName} ({currentCount}/{limit} usuários ativos)
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-white hover:bg-[#18201C] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          <div className="p-4 rounded-2xl bg-[#111513] border border-[#222924] space-y-2 text-xs leading-relaxed">
            <p className="text-gray-200">
              Você atingiu o limite máximo de <strong>{limit} operador(es)</strong> permitido no seu plano <strong>{planName}</strong>.
            </p>
            <p className="text-muted-foreground text-[11px]">
              Para adicionar novos vendedores, operadores de estoque ou equipe financeira, faça o upgrade para o plano <strong>{nextPlanName}</strong>.
            </p>
          </div>

          {/* Value Props Comparison */}
          <div className="space-y-2.5">
            <h5 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Vantagens do Upgrade
            </h5>

            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-gray-200">
                <div className="w-4 h-4 rounded-full bg-[#57EF40]/10 text-[#57EF40] flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3" />
                </div>
                <span>Mais operadores com permissões e Kanban individualizado</span>
              </div>

              <div className="flex items-center gap-2 text-gray-200">
                <div className="w-4 h-4 rounded-full bg-[#57EF40]/10 text-[#57EF40] flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3" />
                </div>
                <span>Discador Automático Preditivo WebRTC e gravação de chamadas</span>
              </div>

              <div className="flex items-center gap-2 text-gray-200">
                <div className="w-4 h-4 rounded-full bg-[#57EF40]/10 text-[#57EF40] flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3" />
                </div>
                <span>Sofia IA: Reativação de clientes inativos e esteira comercial</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-[#222924] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#18201C] hover:bg-[#202B25] text-xs font-semibold text-gray-300 hover:text-white border border-[#222924] transition-colors"
            >
              Agora Não
            </button>

            <Link
              href="/billing/plan-selection"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-[#57EF40] hover:opacity-95 text-[#070908] font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-[#57EF40]/10 active:scale-95 transition-all"
            >
              <span>Fazer Upgrade de Plano</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
