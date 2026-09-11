'use client';

import React, { useEffect, useState } from 'react';
import { 
  PhoneCall, 
  Users, 
  Phone,
  RefreshCw,
  PhoneForwarded,
  Sparkles,
  Voicemail,
  AlertTriangle,
  CheckCircle2,
  PhoneOff,
  Play,
  Pause,
  StopCircle,
  Clock,
  TrendingUp,
  CalendarCheck,
  FastForward,
  CheckSquare,
  Square,
  ShieldCheck,
  Search,
  Filter,
  Flame,
  Volume2
} from 'lucide-react';
import { api } from '../../lib/api';
import { formatPhone } from '../../lib/utils';
import { useSoftphoneStore } from '../../stores/useSoftphoneStore';
import { CallOutcomeStatus } from '@omnicrm/shared';

export default function DialerPage() {
  const { 
    startCall, 
    toggleOpen,
    isPowerDialerActive,
    powerDialerSession,
    countdownSeconds,
    startPowerDialer,
    skipCountdownAndDialNow,
    cancelCountdown,
    pausePowerDialer,
    stopPowerDialer,
    syncPowerDialerSession
  } = useSoftphoneStore();

  const [calls, setCalls] = useState<any[]>([]);
  const [allLeads, setAllLeads] = useState<any[]>([]);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [allCalls, leadsRes] = await Promise.all([
        api.getCalls(),
        api.getLeads({ limit: 100 })
      ]);
      setCalls(allCalls);
      const leads = leadsRes.data || [];
      setAllLeads(leads);
      if (selectedLeadIds.length === 0) {
        // Pre-select first leads for quick-start demo
        setSelectedLeadIds(leads.slice(0, 5).map((l: any) => l.id));
      }
      await syncPowerDialerSession();
    } catch (err) {
      console.error('Failed to load dialer data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredLeads = allLeads.filter((lead) => {
    if (stageFilter !== 'ALL' && lead.funnelStage !== stageFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        lead.name.toLowerCase().includes(q) ||
        lead.phone.toLowerCase().includes(q) ||
        (lead.company && lead.company.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const toggleSelectLead = (id: string) => {
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedLeadIds.length === filteredLeads.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(filteredLeads.map((l) => l.id));
    }
  };

  const handleStartPowerDialer = async () => {
    if (selectedLeadIds.length === 0) return;
    await startPowerDialer(selectedLeadIds);
  };

  const getStatusBadge = (status: CallOutcomeStatus | string) => {
    switch (status) {
      case CallOutcomeStatus.ATENDIDA:
      case 'atendida':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#57EF40]/10 text-[#57EF40] border border-[#57EF40]/30 shadow-[0_0_8px_rgba(87,239,64,0.15)]">
            <CheckCircle2 className="w-3 h-3" /> Atendida - Sucesso
          </span>
        );
      case CallOutcomeStatus.REUNIAO_AGENDADA:
      case 'reuniao_agendada':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CalendarCheck className="w-3 h-3" /> Reunião Agendada
          </span>
        );
      case CallOutcomeStatus.NAO_ATENDEU:
      case 'nao_atendeu':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <PhoneOff className="w-3 h-3" /> Não Atendeu
          </span>
        );
      case CallOutcomeStatus.OCUPADO:
      case 'ocupado':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <PhoneOff className="w-3 h-3" /> Ocupado
          </span>
        );
      case CallOutcomeStatus.CAIXA_POSTAL:
      case 'caixa_postal':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
            <Voicemail className="w-3 h-3" /> Caixa Postal
          </span>
        );
      case CallOutcomeStatus.SEM_INTERESSE:
      case 'sem_interesse':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/30">
            <PhoneOff className="w-3 h-3" /> Sem Interesse
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#18201C] text-gray-400 border border-[#26332B]">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header & Campaign Banner */}
      <div className="p-6 rounded-3xl bg-[#111513] border border-[#222924] shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#18201C] text-[#57EF40] border border-[#222924] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#57EF40]" />
              Fila Automática de Ligações
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Central de Ligações
          </h1>
          <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
            Selecione contatos da lista para iniciar o ciclo de ligações contínuas com tabulação ágil pós-atendimento.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {!isPowerDialerActive ? (
            <button
              onClick={handleStartPowerDialer}
              disabled={selectedLeadIds.length === 0}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-[#57EF40] to-[#65C556] hover:opacity-95 disabled:opacity-40 text-[#070908] font-extrabold text-xs shadow-glow-green transition-all cursor-pointer active:scale-95"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Iniciar Ligações ({selectedLeadIds.length})</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={pausePowerDialer}
                className="px-4 py-3 rounded-2xl bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold text-xs flex items-center gap-2 hover:bg-amber-500/25 transition-colors"
              >
                <Pause className="w-4 h-4" />
                <span>Pausar Fila</span>
              </button>

              <button
                onClick={stopPowerDialer}
                className="px-4 py-3 rounded-2xl bg-red-500/15 text-red-300 border border-red-500/30 font-bold text-xs flex items-center gap-2 hover:bg-red-500/25 transition-colors"
              >
                <StopCircle className="w-4 h-4" />
                <span>Encerrar Sessão</span>
              </button>
            </div>
          )}

          <button
            onClick={toggleOpen}
            className="px-4 py-3 rounded-2xl bg-[#18201C] hover:bg-[#202B25] text-white border border-[#222924] hover:border-[#333E37] font-semibold text-xs flex items-center gap-2 transition-all"
          >
            <PhoneForwarded className="w-4 h-4 text-[#57EF40]" />
            <span>Teclado de Discagem</span>
          </button>
        </div>
      </div>

      {/* 3-Second Countdown Notification Banner */}
      {countdownSeconds !== null && (
        <div className="p-4 rounded-3xl bg-[#57EF40]/15 border-2 border-[#57EF40] text-white flex items-center justify-between shadow-[0_0_30px_rgba(87,239,64,0.3)] animate-pulse">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#57EF40] text-[#070908] flex items-center justify-center font-black text-xl shadow-[0_0_15px_#57EF40]">
              {countdownSeconds}
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#57EF40]" />
                Próxima chamada iniciando em {countdownSeconds} segundos...
              </h4>
              <p className="text-xs text-gray-300">
                Tabulação gravada. Disparando chamada automática para o próximo lead da fila.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={cancelCountdown}
              className="px-4 py-2 rounded-xl bg-[#18201C] text-gray-300 hover:text-white text-xs font-bold border border-[#26332B]"
            >
              Pausar Fila
            </button>
            <button
              onClick={skipCountdownAndDialNow}
              className="px-4 py-2 rounded-xl bg-[#57EF40] text-[#070908] text-xs font-black shadow-[0_0_15px_rgba(87,239,64,0.35)] flex items-center gap-1.5 hover:brightness-110 active:scale-95"
            >
              <FastForward className="w-3.5 h-3.5" />
              <span>Discar Agora</span>
            </button>
          </div>
        </div>
      )}

      {/* Real-time Metrics Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-[#111513] border border-[#222924] space-y-1">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <PhoneCall className="w-3.5 h-3.5 text-[#57EF40]" /> Total Chamadas
          </span>
          <p className="text-2xl font-black text-white font-mono">
            {powerDialerSession?.totalCalls || calls.length}
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-[#111513] border border-[#222924] space-y-1">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-[#57EF40]" /> Contatos Efetivos
          </span>
          <p className="text-2xl font-black text-white font-mono">
            {powerDialerSession?.successfulContacts || calls.filter(c => c.status === 'atendida').length}
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-[#111513] border border-[#222924] space-y-1">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <CalendarCheck className="w-3.5 h-3.5 text-[#57EF40]" /> Reuniões Agendadas
          </span>
          <p className="text-2xl font-black text-[#57EF40] font-mono">
            {powerDialerSession?.scheduledMeetings || 2}
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-[#111513] border border-[#222924] space-y-1">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" /> Tempo Médio (TMA)
          </span>
          <p className="text-2xl font-black text-white font-mono">
            02:18
          </p>
        </div>
      </div>

      {/* Main Grid: Lead Selection & Queue Manager (Left) vs Call Logs (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Lead Selection & Active Queue (7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-[#111513] border border-[#222924] space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#222924]">
            <div>
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-[#57EF40]" />
                Fila de Contatos
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Selecione os contatos e inicie o ciclo de ligações
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSelectAll}
                className="px-3 py-1.5 rounded-xl bg-[#18201C] text-xs font-semibold text-white border border-[#222924] hover:border-[#333E37] flex items-center gap-1.5 transition-colors"
              >
                {selectedLeadIds.length === filteredLeads.length && filteredLeads.length > 0 ? (
                  <CheckSquare className="w-3.5 h-3.5 text-[#57EF40]" />
                ) : (
                  <Square className="w-3.5 h-3.5 text-muted-foreground" />
                )}
                <span>Selecionar Todos ({filteredLeads.length})</span>
              </button>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filtrar por nome, telefone ou empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#18201C] border border-[#222924] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-muted-foreground outline-none focus:border-[#57EF40] transition-colors font-medium"
              />
            </div>

            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="bg-[#18201C] border border-[#222924] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#57EF40] cursor-pointer"
            >
              <option value="ALL">Todos os Estágios</option>
              <option value="NOVO_LEAD">Novo Lead</option>
              <option value="QUALIFICACAO">Em Qualificação</option>
              <option value="PROPOSTA">Proposta Enviada</option>
              <option value="FOLLOWUP_ATIVO">Follow-up Ativo</option>
              <option value="FECHADO_GANHO">Fechado / Ganho</option>
              <option value="PERDIDO">Perdido</option>
            </select>
          </div>

          {/* Leads List with Checkbox */}
          <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1 scrollbar-thin">
            {filteredLeads.map((lead) => {
              const isSelected = selectedLeadIds.includes(lead.id);
              const isQueueItem = powerDialerSession?.queue.find(q => q.leadId === lead.id);

              return (
                <div
                  key={lead.id}
                  onClick={() => toggleSelectLead(lead.id)}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#18201C] border-[#57EF40]/50 shadow-sm ring-1 ring-[#57EF40]/20'
                      : 'bg-[#18201C]/60 border-[#222924] hover:bg-[#18201C] hover:border-[#333E37]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelectLead(lead.id);
                      }}
                      className="text-[#57EF40] shrink-0"
                    >
                      {isSelected ? <CheckSquare className="w-4 h-4 text-[#57EF40]" /> : <Square className="w-4 h-4 text-muted-foreground" />}
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-xs text-white truncate">{lead.name}</h4>
                        {lead.company && (
                          <span className="text-[10px] text-muted-foreground font-normal">({lead.company})</span>
                        )}
                      </div>
                      <p className="text-[11px] font-mono text-muted-foreground font-medium mt-0.5">
                        {formatPhone(lead.phone)}
                      </p>
                    </div>
                  </div>

                  {/* Status / Quick Call */}
                  <div className="flex items-center gap-2 shrink-0">
                    {isQueueItem ? (
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                        isQueueItem.status === 'IN_CALL'
                          ? 'bg-[#57EF40]/15 text-[#57EF40] border border-[#57EF40]/40 animate-pulse'
                          : isQueueItem.status === 'COMPLETED'
                          ? 'bg-[#18201C] text-emerald-400 border border-emerald-500/30'
                          : isQueueItem.status === 'FAILED'
                          ? 'bg-[#18201C] text-red-400 border border-red-500/30'
                          : 'bg-[#18201C] text-muted-foreground border border-[#222924]'
                      }`}>
                        {isQueueItem.status === 'IN_CALL' ? '📞 Em Chamada...' : isQueueItem.status}
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground px-2 py-0.5 rounded-md bg-[#18201C] border border-[#222924]">
                        {lead.funnelStage || 'Novo Lead'}
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        startCall(lead);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-[#57EF40] hover:bg-[#65C556] text-[#070908] font-bold text-[11px] flex items-center gap-1 transition-all shadow-sm active:scale-95"
                      title="Ligar para o Lead"
                    >
                      <Phone className="w-3 h-3 fill-current" />
                      <span>Ligar</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Call Logs Table (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-[#111513] border border-[#222924] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#222924]">
            <div>
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-[#57EF40]" />
                Histórico de Chamadas
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Classificações e desfechos salvos</p>
            </div>
            <button onClick={loadData} className="text-muted-foreground hover:text-white p-1.5 rounded-lg bg-[#18201C] border border-[#222924] transition-colors">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1 scrollbar-thin">
            {calls.length > 0 ? (
              calls.map((call) => (
                <div
                  key={call.id}
                  className="p-3.5 rounded-2xl bg-[#18201C] border border-[#222924] space-y-2 hover:border-[#333E37] transition-all shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white truncate">
                      {call.lead?.name || 'Lead Anônimo'}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {new Date(call.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono text-muted-foreground font-medium">
                      {formatPhone(call.lead?.phone || '')}
                    </span>
                    <span className="font-mono text-muted-foreground">
                      {Math.floor(call.duration / 60)}m {call.duration % 60}s
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-[#222924]">
                    <div>{getStatusBadge(call.status)}</div>
                    {call.notes && (
                      <span className="text-[10px] text-muted-foreground italic truncate max-w-[140px]" title={call.notes}>
                        "{call.notes}"
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center border border-dashed border-[#222924] rounded-2xl">
                <p className="text-xs text-muted-foreground">Nenhuma chamada registrada ainda.</p>
                <p className="text-[11px] text-muted-foreground/60 mt-1">Inicie uma ligação pela central.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
