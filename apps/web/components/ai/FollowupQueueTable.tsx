'use client';

import React, { useEffect, useState } from 'react';
import { 
  Clock, 
  Play, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Calendar, 
  RefreshCw, 
  Plus, 
  ShieldCheck,
  Send,
  Zap
} from 'lucide-react';
import { api } from '../../lib/api';
import { wsClient } from '../../lib/websocket';
import { WSEventType } from '@omnicrm/shared';
import { Button } from '../ui/Button';

interface FollowupItem {
  id: string;
  leadId: string;
  triggerType: string;
  scheduledFor: string;
  status: 'pendente' | 'executado' | 'cancelado';
  step: number;
  notes?: string;
  lead?: {
    id: string;
    name: string;
    phone: string;
    company?: string;
    optOut?: boolean;
    funnelStage?: string;
  };
  createdAt: string;
}

export function FollowupQueueTable() {
  const [queue, setQueue] = useState<FollowupItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadQueue = async () => {
    setIsLoading(true);
    try {
      const data = await api.getFollowupQueue();
      setQueue(data || []);
    } catch (err) {
      console.error('Failed to fetch followup queue:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
    wsClient.connect();
    const unsub = wsClient.on(WSEventType.AI_FOLLOWUP_TRIGGERED, () => {
      loadQueue();
    });
    return () => unsub();
  }, []);

  const handleProcessNow = async () => {
    setIsProcessing(true);
    try {
      const res = await api.processFollowupQueueNow();
      setFeedback(`Fila processada! Executados: ${res.stats?.executed || 0}, Reagendados: ${res.stats?.rescheduled || 0}, Cancelados: ${res.stats?.cancelled || 0}`);
      await loadQueue();
      setTimeout(() => setFeedback(null), 5000);
    } catch (err: any) {
      setFeedback(`Erro ao processar fila: ${err.message}`);
      setTimeout(() => setFeedback(null), 5000);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelItem = async (id: string) => {
    try {
      await api.cancelFollowupQueueItem(id, 'Cancelado manualmente via Painel');
      await loadQueue();
    } catch (err) {
      console.error('Failed to cancel followup item:', err);
    }
  };

  const handleTestEnqueue = async () => {
    try {
      const leadsRes = await api.getLeads({ limit: 1 });
      const firstLead = leadsRes.data?.[0];
      if (firstLead) {
        await api.enqueueFollowup(firstLead.id, 'DISPOSITION_NAO_ATENDEU', 0); // 0 min = ready now
        await loadQueue();
        setFeedback(`Follow-up de teste agendado para "${firstLead.name}"!`);
        setTimeout(() => setFeedback(null), 4000);
      }
    } catch (err: any) {
      console.error('Failed to enqueue test followup:', err);
    }
  };

  const getTriggerLabel = (trigger: string) => {
    switch (trigger) {
      case 'DISPOSITION_NAO_ATENDEU':
        return { label: 'Ligação: Não Atendeu (+10m)', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
      case 'DISPOSITION_OCUPADO':
        return { label: 'Ligação: Ocupado (+10m)', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' };
      case 'STAGNANT_PROPOSAL':
        return { label: 'Proposta Parada >24h', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' };
      case 'DISPOSITION_INTERESSADO':
        return { label: 'Pós-Demonstração', color: 'text-primary bg-primary/10 border-primary/20' };
      default:
        return { label: trigger, color: 'text-zinc-400 bg-zinc-800/40 border-zinc-700/40' };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente':
        return (
          <span className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
            <Clock className="w-3 h-3 animate-pulse" />
            Pendente
          </span>
        );
      case 'executado':
        return (
          <span className="flex items-center gap-1.5 text-[11px] font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20 shadow-glow-green-sm">
            <CheckCircle2 className="w-3 h-3" />
            Executado
          </span>
        );
      case 'cancelado':
        return (
          <span className="flex items-center gap-1.5 text-[11px] font-bold text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20">
            <XCircle className="w-3 h-3" />
            Cancelado
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="p-6 rounded-3xl glass-elevated border border-border space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-sm text-foreground uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              Fila de Follow-up Automático Orientada a Eventos
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/25">
              Worker Cron (5 min)
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Gatilhos de discador, propostas estagnadas e réguas comerciais com IA Sofia e validação LGPD/Opt-out.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button 
            onClick={handleTestEnqueue} 
            variant="outline" 
            size="sm" 
            className="text-xs gap-1.5 border-border"
          >
            <Plus className="w-3.5 h-3.5 text-primary" />
            <span>Simular Gatilho</span>
          </Button>

          <Button 
            onClick={handleProcessNow} 
            disabled={isProcessing} 
            size="sm" 
            className="text-xs gap-1.5"
          >
            {isProcessing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isProcessing ? 'Processando...' : 'Processar Fila Agora'}</span>
          </Button>
        </div>
      </div>

      {/* Safety & Compliance Badges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3 rounded-2xl bg-surface/70 border border-border/80 flex items-center gap-3 text-xs">
          <Clock className="w-4 h-4 text-primary shrink-0" />
          <div>
            <span className="font-bold text-foreground block text-[11px]">Horário Comercial</span>
            <span className="text-[10px] text-muted-foreground">Seg a Sex, 09:00 às 19:00 (Reagenda se fora)</span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-surface/70 border border-border/80 flex items-center gap-3 text-xs">
          <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
          <div>
            <span className="font-bold text-foreground block text-[11px]">Validação de Opt-Out</span>
            <span className="text-[10px] text-muted-foreground">Cancela automaticamente se opt_out == true</span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-surface/70 border border-border/80 flex items-center gap-3 text-xs">
          <Send className="w-4 h-4 text-primary shrink-0" />
          <div>
            <span className="font-bold text-foreground block text-[11px]">Interação Recente</span>
            <span className="text-[10px] text-muted-foreground">Cancela se lead responder ou em suporte humano</span>
          </div>
        </div>
      </div>

      {feedback && (
        <div className="p-3 rounded-2xl bg-primary/10 border border-primary/30 text-xs text-primary flex items-center gap-2 animate-fade-in font-mono">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Queue Table */}
      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-surface border-b border-border text-muted-foreground font-mono uppercase text-[10px]">
              <th className="py-3 px-4">Lead</th>
              <th className="py-3 px-4">Gatilho</th>
              <th className="py-3 px-4">Agendado Para</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Observações</th>
              <th className="py-3 px-4 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-surface/40">
            {isLoading && queue.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-muted-foreground">
                  <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-primary" />
                  Carregando fila de automação...
                </td>
              </tr>
            ) : queue.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-muted-foreground">
                  Nenhum follow-up na fila no momento.
                </td>
              </tr>
            ) : (
              queue.map((item) => {
                const triggerBadge = getTriggerLabel(item.triggerType);
                const isPendente = item.status === 'pendente';
                const scheduledDate = new Date(item.scheduledFor);

                return (
                  <tr key={item.id} className="hover:bg-surface/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-foreground">
                      <div className="flex flex-col">
                        <span>{item.lead?.name || 'Lead Desconhecido'}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">{item.lead?.phone || 'Sem telefone'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${triggerBadge.color}`}>
                        {triggerBadge.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground">
                      {scheduledDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} • {scheduledDate.toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="py-3 px-4 text-[11px] text-muted-foreground max-w-xs truncate">
                      {item.notes || '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {isPendente && (
                        <button
                          onClick={() => handleCancelItem(item.id)}
                          className="text-[11px] text-rose-400 hover:text-rose-300 font-bold px-2 py-1 rounded-lg hover:bg-rose-500/10 transition-colors"
                        >
                          Cancelar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
