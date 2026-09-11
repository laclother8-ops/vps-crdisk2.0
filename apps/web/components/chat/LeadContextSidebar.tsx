'use client';

import React, { useState } from 'react';
import { 
  User, 
  Phone, 
  Mail, 
  Building2, 
  Tag, 
  Bot, 
  Sparkles, 
  ShieldAlert, 
  Calendar, 
  TrendingUp, 
  PhoneCall,
  Volume2,
  ChevronDown,
  Play,
  Pause
} from 'lucide-react';
import { useChatStore } from '../../stores/useChatStore';
import { useSoftphoneStore } from '../../stores/useSoftphoneStore';
import { formatPhone } from '../../lib/utils';
import { FunnelStage } from '@omnicrm/shared';
import { api } from '../../lib/api';

const STAGE_OPTIONS = [
  { value: FunnelStage.NOVO_LEAD, label: 'Novo Lead' },
  { value: FunnelStage.QUALIFICACAO, label: 'Em Qualificação' },
  { value: FunnelStage.APRESENTACAO, label: 'Proposta Enviada' },
  { value: FunnelStage.FOLLOWUP_ATIVO, label: 'Follow-up Ativo' },
  { value: FunnelStage.FECHADO_GANHO, label: 'Fechado / Ganho' },
  { value: FunnelStage.PERDIDO, label: 'Perdido' }
];

export function LeadContextSidebar() {
  const { conversations, selectedLeadId, toggleHumanMode } = useChatStore();
  const { startCall } = useSoftphoneStore();
  const [playingCallId, setPlayingCallId] = useState<string | null>(null);

  const selectedConv = conversations.find((c) => c.leadId === selectedLeadId);
  const lead = selectedConv?.lead;

  if (!lead) {
    return (
      <div className="w-80 border-l border-[#26332B] bg-[#111513] p-6 flex flex-col items-center justify-center text-muted-foreground text-xs shrink-0">
        <User className="w-10 h-10 text-muted mb-2" />
        <p>Nenhum lead selecionado.</p>
      </div>
    );
  }

  const isHumanMode = selectedConv?.isHumanHandled || lead.status === ('em_atendimento_humano' as any);

  const handleStageChange = async (newStage: string) => {
    try {
      await api.moveDealStage(lead.id, newStage);
      if (lead) {
        lead.funnelStage = newStage as any;
      }
    } catch (err) {
      console.error('Failed to change stage:', err);
    }
  };

  const recentCalls = [
    {
      id: 'call-1',
      date: 'Hoje, 10:24',
      status: lead.lastCallStatus || 'Atendida - Sucesso',
      duration: '02:45',
      color: 'emerald',
      notes: 'Lead demonstrou forte interesse no plano Enterprise.'
    },
    {
      id: 'call-2',
      date: 'Ontem, 16:10',
      status: 'Não Atendeu / Ocupado',
      duration: '00:15',
      color: 'amber',
      notes: 'Linha ocupada, disparado follow-up automático no WhatsApp.'
    },
    {
      id: 'call-3',
      date: '08/09, 14:30',
      status: 'Atendida - Qualificação',
      duration: '04:12',
      color: 'emerald',
      notes: 'Primeiro contato realizado pelo discador automático.'
    }
  ];

  return (
    <div className="w-80 xl:w-96 border-l border-[#222924] bg-[#111513] flex flex-col h-full overflow-y-auto shrink-0 divide-y divide-[#222924]">
      {/* Lead Profile Header */}
      <div className="p-6 flex flex-col items-center text-center relative bg-[#0c0f0d]/40">
        <div className="relative mb-3">
          <div className="w-14 h-14 rounded-2xl bg-[#18201C] border border-[#222924] flex items-center justify-center text-white font-bold text-lg">
            {lead.name ? lead.name.charAt(0).toUpperCase() : 'C'}
          </div>
          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#57EF40] ring-2 ring-[#111513]" />
        </div>

        <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
          {lead.name}
        </h3>

        {lead.company && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <Building2 className="w-3.5 h-3.5 text-muted-foreground/60" />
            {lead.company}
          </p>
        )}

        {/* Lead Score */}
        <div className="flex items-center gap-2 mt-3">
          <span className="text-[10px] font-semibold px-2.5 py-1 rounded-xl bg-[#18201C] text-muted-foreground border border-[#222924] flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-[#57EF40]" />
            Score: <strong className="text-white font-mono">{lead.score || 85}/100</strong>
          </span>
          <span className="text-[10px] font-semibold px-2.5 py-1 rounded-xl bg-[#18201C] text-muted-foreground border border-[#222924]">
            {lead.tags?.[0] || 'Inbound'}
          </span>
        </div>

        {/* Quick Call Action */}
        <button
          onClick={() => startCall(lead)}
          className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#57EF40] to-[#65C556] text-[#070908] font-bold text-xs shadow-glow-green transition-all active:scale-95 hover:opacity-95 cursor-pointer"
        >
          <Phone className="w-3.5 h-3.5 fill-current" />
          <span>Ligar para o Lead</span>
        </button>
      </div>

      {/* Funnel Stage Sync Dropdown */}
      <div className="p-5 space-y-2">
        <label className="text-xs font-bold text-foreground flex items-center justify-between">
          <span>Estágio no Funil</span>
          <span className="text-[10px] text-[#57EF40] font-mono font-semibold">Sincronizado</span>
        </label>
        <div className="relative">
          <select
            value={lead.funnelStage || FunnelStage.QUALIFICACAO}
            onChange={(e) => handleStageChange(e.target.value)}
            className="w-full bg-[#18201C] border border-[#222924] focus:border-[#57EF40] rounded-xl px-3.5 py-2.5 text-xs text-foreground font-semibold outline-none appearance-none cursor-pointer"
          >
            {STAGE_OPTIONS.map((st) => (
              <option key={st.value} value={st.value} className="bg-[#111513] text-foreground">
                {st.label}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Mode Switch: Human Takeover vs AI Sofia */}
      <div className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Bot className="w-4 h-4 text-[#57EF40]" />
            Modo de Atendimento
          </span>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
            isHumanMode 
              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' 
              : 'bg-[#18201C] text-[#57EF40] border border-[#222924]'
          }`}>
            {isHumanMode ? 'Humano Ativo' : 'Sofia IA'}
          </span>
        </div>

        {/* Toggle Switch Button */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#0c0f0d] rounded-xl border border-[#222924]">
          <button
            onClick={() => toggleHumanMode(lead.id, false)}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              !isHumanMode
                ? 'bg-[#18201C] text-white border border-[#222924] font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Sofia IA</span>
          </button>
          <button
            onClick={() => toggleHumanMode(lead.id, true)}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              isHumanMode
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Atendente</span>
          </button>
        </div>

        {/* Business Rule Warning Alert */}
        {isHumanMode && (
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] leading-relaxed flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
            <span>
              <strong>Atendimento Humano em curso:</strong> As respostas automáticas da IA Sofia estão pausadas para este lead.
            </span>
          </div>
        )}
      </div>

      {/* Contact Details */}
      <div className="p-5 space-y-3">
        <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-[#57EF40]" />
          Dados de Contato
        </h4>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#070908] border border-[#26332B]">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Phone className="w-3 h-3 text-muted" /> Telefone
            </span>
            <span className="font-mono font-bold text-[#57EF40]">{formatPhone(lead.phone)}</span>
          </div>

          {lead.email && (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#070908] border border-[#26332B]">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Mail className="w-3 h-3 text-muted" /> E-mail
              </span>
              <span className="text-foreground truncate max-w-[140px]">{lead.email}</span>
            </div>
          )}

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#070908] border border-[#26332B]">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Calendar className="w-3 h-3 text-muted" /> Criado em
            </span>
            <span className="text-foreground">
              {new Date(lead.createdAt).toLocaleDateString('pt-BR')}
            </span>
          </div>
        </div>
      </div>

      {/* Summary of Last 3 Calls From Dialer */}
      <div className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <PhoneCall className="w-3.5 h-3.5 text-[#57EF40]" />
            Últimas 3 Chamadas WebRTC
          </h4>
          <span className="text-[10px] font-mono text-muted-foreground">Discador</span>
        </div>

        <div className="space-y-2.5">
          {recentCalls.map((c) => {
            const isPlaying = playingCallId === c.id;
            return (
              <div key={c.id} className="p-3 rounded-2xl bg-[#070908] border border-[#26332B] space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPlayingCallId(isPlaying ? null : c.id)}
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                        isPlaying ? 'bg-[#57EF40] text-[#070908]' : 'bg-[#18201C] text-[#57EF40] hover:bg-[#57EF40]/20'
                      }`}
                      title={isPlaying ? 'Pausar gravação' : 'Ouvir gravação da chamada'}
                    >
                      {isPlaying ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current ml-0.5" />}
                    </button>
                    <span>{c.date}</span>
                  </span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                    c.color === 'emerald'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {c.duration}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground pl-7 leading-relaxed">
                  <strong>{c.status}:</strong> {c.notes}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

