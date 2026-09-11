'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  TrendingUp, 
  Users, 
  PhoneCall, 
  Bot, 
  Zap, 
  ArrowUpRight, 
  Clock, 
  Phone,
  Sparkles,
  DollarSign,
  Plus
} from 'lucide-react';
import { api } from '../../lib/api';
import { formatCurrency, formatPhone } from '../../lib/utils';
import { useSoftphoneStore } from '../../stores/useSoftphoneStore';
import { useCRMStore } from '../../stores/useCRMStore';

export default function DashboardPage() {
  const { startCall, toggleOpen } = useSoftphoneStore();
  const { openCreateDeal } = useCRMStore();

  const [recentLeads, setRecentLeads] = useState<any[]>([]);
  const [recentCalls, setRecentCalls] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [leadsRes, calls] = await Promise.all([
          api.getLeads({ limit: 4 }),
          api.getCalls()
        ]);
        setRecentLeads(leadsRes.data || []);
        setRecentCalls(calls.slice(0, 4));
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="p-7 rounded-3xl bg-[#111513] border border-[#222924] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#18201C] border border-[#222924] text-xs font-bold text-[#57EF40]">
            <Sparkles className="w-3.5 h-3.5 text-[#57EF40]" />
            <span>Visão Geral de Vendas</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Olá! Acompanhe o desempenho comercial em tempo real.
          </h1>
          <p className="text-xs text-muted-foreground">
            Métricas de vendas consolidadas, oportunidades do funil e histórico de atendimento.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={openCreateDeal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#57EF40] to-[#65C556] hover:opacity-95 text-[#070908] text-xs font-extrabold shadow-glow-green active:scale-[0.99] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#070908]" />
            <span>+ Novo Lead</span>
          </button>
          <button
            onClick={toggleOpen}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#18201C] hover:bg-[#202B25] text-white border border-[#222924] hover:border-[#333E37] text-xs font-semibold transition-all cursor-pointer"
          >
            <Phone className="w-4 h-4 text-[#57EF40]" />
            <span>Central de Ligações</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Pipeline Value */}
        <div className="p-5 rounded-3xl bg-[#111513] border border-[#222924] space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">Receita em Pipeline</span>
            <div className="w-8 h-8 rounded-xl bg-[#18201C] text-[#57EF40] border border-[#222924] flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-white font-mono">
            {formatCurrency(239500)}
          </h3>
          <p className="text-[11px] text-[#57EF40] flex items-center gap-1 font-semibold">
            <TrendingUp className="w-3 h-3" /> +18.5% neste trimestre
          </p>
        </div>

        {/* Card 2: Calls Made */}
        <div className="p-5 rounded-3xl bg-[#111513] border border-[#222924] space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">Ligações Realizadas</span>
            <div className="w-8 h-8 rounded-xl bg-[#18201C] text-[#57EF40] border border-[#222924] flex items-center justify-center">
              <PhoneCall className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-white font-mono">
            26 <span className="text-xs text-muted-foreground font-normal">chamadas</span>
          </h3>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
            <Clock className="w-3 h-3 text-muted-foreground/70" /> Tempo médio: 3min 40s
          </p>
        </div>

        {/* Card 3: AI Handled */}
        <div className="p-5 rounded-3xl bg-[#111513] border border-[#222924] space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">Atendimentos com IA</span>
            <div className="w-8 h-8 rounded-xl bg-[#18201C] text-[#57EF40] border border-[#222924] flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-white font-mono">
            58 <span className="text-xs text-muted-foreground font-normal">interações</span>
          </h3>
          <p className="text-[11px] text-[#57EF40] flex items-center gap-1 font-semibold">
            <Zap className="w-3 h-3 fill-[#57EF40]" /> 11 Reuniões agendadas
          </p>
        </div>

        {/* Card 4: Conversion Rate */}
        <div className="p-5 rounded-3xl bg-[#111513] border border-[#222924] space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">Taxa de Conversão</span>
            <div className="w-8 h-8 rounded-xl bg-[#18201C] text-[#57EF40] border border-[#222924] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-white font-mono">
            38.4%
          </h3>
          <p className="text-[11px] text-[#57EF40] flex items-center gap-1 font-semibold">
            <TrendingUp className="w-3 h-3" /> Recuperação pós-contato
          </p>
        </div>
      </div>

      {/* Two Column Layout: Recent Leads & Recent Calls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Leads */}
        <div className="p-6 rounded-3xl bg-[#111513] border border-[#222924] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-xs text-foreground uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-[#57EF40]" />
                Leads Recentes
              </h3>
              <p className="text-xs text-muted-foreground">Últimos contatos cadastrados na plataforma</p>
            </div>
            <Link
              href="/crm"
              className="text-xs font-bold text-[#57EF40] hover:underline flex items-center gap-1"
            >
              Ver Funil <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-[#222924]">
            {recentLeads.map((lead) => (
              <div key={lead.id} className="py-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-[#18201C] border border-[#222924] flex items-center justify-center text-xs font-bold text-[#57EF40] shrink-0">
                    {lead.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-xs text-foreground truncate">{lead.name}</h4>
                    <p className="text-[11px] text-muted-foreground font-mono">{formatPhone(lead.phone)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#18201C] text-muted-foreground border border-[#222924]">
                    {lead.company || 'Pessoa Física'}
                  </span>
                  <button
                    onClick={() => startCall(lead)}
                    className="p-2 rounded-xl bg-[#18201C] hover:bg-[#202B25] text-[#57EF40] border border-[#222924] hover:border-[#57EF40]/40 transition-colors"
                    title="Ligar para o Lead"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Calls & Dispositions */}
        <div className="p-6 rounded-3xl bg-[#111513] border border-[#222924] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-xs text-foreground uppercase tracking-wider flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-[#57EF40]" />
                Histórico de Ligações
              </h3>
              <p className="text-xs text-muted-foreground">Últimas chamadas e desfechos registrados</p>
            </div>
            <Link
              href="/dialer"
              className="text-xs font-bold text-[#57EF40] hover:underline flex items-center gap-1"
            >
              Abrir Central <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-[#222924]">
            {recentCalls.map((call) => (
              <div key={call.id} className="py-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-[#18201C] border border-[#222924] flex items-center justify-center text-xs font-bold text-[#57EF40] shrink-0">
                    <PhoneCall className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-xs text-foreground truncate">{call.lead?.name || 'Lead'}</h4>
                    <p className="text-[11px] text-muted-foreground font-mono">
                      Duração: {Math.floor(call.duration / 60)}m {call.duration % 60}s
                    </p>
                  </div>
                </div>

                <div className="shrink-0">
                  <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-[#18201C] text-[#57EF40] border border-[#222924]">
                    {call.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
