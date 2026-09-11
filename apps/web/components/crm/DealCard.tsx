'use client';

import React from 'react';
import { Phone, MessageSquare, Building, Clock, Flame, Tag, CheckCircle, Bot, Headphones } from 'lucide-react';
import { Lead } from '@omnicrm/shared';
import { formatCurrency, formatPhone } from '../../lib/utils';
import { useSoftphoneStore } from '../../stores/useSoftphoneStore';
import { useCRMStore } from '../../stores/useCRMStore';

interface DealCardProps {
  lead: Lead;
}

function formatRelativeTime(dateInput?: string | Date): string {
  if (!dateInput) return 'Recentemente';
  const date = new Date(dateInput);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'Agora mesmo';
  if (diffMinutes < 60) return `Há ${diffMinutes} min`;
  if (diffHours < 24) return `Há ${diffHours}h`;
  if (diffDays === 1) return 'Ontem';
  if (diffDays < 7) return `Há ${diffDays} dias`;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function getStatusBadgeConfig(status?: string) {
  switch (status) {
    case 'qualificado':
    case 'interessado':
    case 'cliente':
      return { label: 'Qualificado', bg: 'bg-[#57EF40]/10', text: 'text-[#57EF40]', border: 'border-[#57EF40]/30' };
    case 'em_atendimento_humano':
      return { label: 'Atendimento Humano', bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' };
    case 'contatado':
      return { label: 'Contatado', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' };
    case 'nao_interessado':
      return { label: 'Sem Interesse', bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' };
    default:
      return { label: 'Novo', bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20' };
  }
}

export function DealCard({ lead }: DealCardProps) {
  const { startCall } = useSoftphoneStore();
  const { openLeadDrawer } = useCRMStore();

  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    startCall(lead);
  };

  const score = lead.score || 50;
  const statusConfig = getStatusBadgeConfig(lead.status);
  const isHumanActive = lead.status === ('em_atendimento_humano' as any);
  const visibleTags = (lead.tags || []).slice(0, 2);
  const extraTagsCount = Math.max(0, (lead.tags || []).length - 2);

  return (
    <div
      onClick={() => openLeadDrawer(lead)}
      className="p-4 rounded-2xl bg-[#111513] border border-[#222924] hover:border-[#38463e] hover:bg-[#141815] transition-all duration-150 cursor-pointer space-y-3 group relative overflow-hidden shadow-sm"
    >
      {/* Top Bar: Avatar, Lead Name, Relative Time & Deal Value */}
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Avatar with status indicator dot */}
          <div className="relative shrink-0">
            <div className="w-8 h-8 rounded-xl bg-[#18201C] border border-[#222924] flex items-center justify-center font-bold text-xs text-white group-hover:text-[#57EF40] transition-colors">
              {lead.name.slice(0, 2).toUpperCase()}
            </div>
            {/* Live presence indicator */}
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#57EF40] ring-2 ring-[#111513]" />
          </div>

          <div className="min-w-0">
            <h4 className="font-bold text-xs text-white group-hover:text-[#57EF40] transition-colors truncate">
              {lead.name}
            </h4>
            {lead.company && (
              <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                <Building className="w-3 h-3 text-muted-foreground/60 shrink-0" />
                <span className="truncate">{lead.company}</span>
              </p>
            )}
          </div>
        </div>

        {/* Deal Value Badge */}
        <span className="font-mono font-bold text-xs text-white bg-[#18201C] px-2.5 py-0.5 rounded-lg border border-[#222924] shrink-0">
          {formatCurrency(Number(lead.dealValue || 15000))}
        </span>
      </div>

      {/* Conversion Score & Time Ago */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
          <span className="flex items-center gap-1">
            <Flame className="w-3 h-3 text-[#57EF40]" />
            Score: <strong className="text-white">{score}/100</strong>
          </span>
          <span className="flex items-center gap-1 text-muted-foreground/80">
            <Clock className="w-3 h-3 text-muted-foreground/60" />
            {formatRelativeTime(lead.updatedAt || lead.createdAt)}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1 rounded-full bg-[#18201C] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#57EF40] to-[#65C556]"
            style={{ width: `${Math.min(Math.max(score, 10), 100)}%` }}
          />
        </div>
      </div>

      {/* Status & Max 2 Tags */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
          {statusConfig.label}
        </span>

        {isHumanActive ? (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
            <Headphones className="w-2.5 h-2.5" />
            Humano
          </span>
        ) : (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#18201C] text-purple-300 border border-purple-500/20 flex items-center gap-1">
            <Bot className="w-2.5 h-2.5 text-purple-400" />
            Sofia IA
          </span>
        )}

        {visibleTags.map((t, idx) => (
          <span
            key={idx}
            className="text-[9px] font-semibold px-2 py-0.5 rounded-md bg-[#18201C] text-muted-foreground border border-[#222924]"
          >
            #{t}
          </span>
        ))}

        {extraTagsCount > 0 && (
          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md bg-[#18201C] text-muted-foreground/60 border border-[#222924]">
            +{extraTagsCount}
          </span>
        )}
      </div>

      {/* Footer: Formatted Phone & Quick Action Buttons */}
      <div className="pt-2 border-t border-[#222924] flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground font-mono">
          {formatPhone(lead.phone)}
        </span>

        <div className="flex items-center gap-1.5">
          {/* Primary Quick Call Button */}
          <button
            type="button"
            onClick={handleCall}
            className="px-2.5 py-1 rounded-lg bg-[#57EF40] hover:bg-[#65C556] text-[#070908] font-bold text-[11px] flex items-center gap-1 transition-all shadow-sm active:scale-95"
            title="Ligar para o Lead"
          >
            <Phone className="w-3 h-3 fill-current" />
            <span>Ligar</span>
          </button>

          {/* Quick WhatsApp Chat */}
          <a
            href={`/chat?leadId=${lead.id}`}
            onClick={(e) => e.stopPropagation()}
            className="p-1.5 rounded-lg bg-[#18201C] hover:bg-[#202B25] text-muted-foreground hover:text-white border border-[#222924] flex items-center justify-center transition-all"
            title="Conversar no WhatsApp"
          >
            <MessageSquare className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
