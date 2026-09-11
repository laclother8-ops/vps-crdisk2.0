'use client';

import React, { useState } from 'react';
import { 
  CheckCircle2, 
  PhoneOff, 
  Voicemail, 
  AlertTriangle,
  CalendarCheck,
  UserX,
  Sparkles,
  X,
  MessageSquareShare,
  Layers,
  FileText
} from 'lucide-react';
import { CallOutcomeStatus } from '@omnicrm/shared';
import { useSoftphoneStore } from '../../stores/useSoftphoneStore';

export function DispositionModal() {
  const { 
    isDispositionOpen, 
    activeLead, 
    submitDisposition, 
    closeDisposition,
    isPowerDialerActive,
    powerDialerSession
  } = useSoftphoneStore();

  const [selectedStatus, setSelectedStatus] = useState<CallOutcomeStatus | null>(null);
  const [notes, setNotes] = useState('');
  const [autoFollowup, setAutoFollowup] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isDispositionOpen) return null;

  const outcomes = [
    { 
      key: CallOutcomeStatus.ATENDIDA, 
      label: 'Atendida - Sucesso', 
      icon: CheckCircle2, 
      color: 'text-[#57EF40] border-[#57EF40]/30 bg-[#57EF40]/10 hover:border-[#57EF40]' 
    },
    { 
      key: CallOutcomeStatus.NAO_ATENDEU, 
      label: 'Não Atendeu / Ocupado', 
      icon: PhoneOff, 
      color: 'text-amber-400 border-amber-500/30 bg-amber-500/10 hover:border-amber-500' 
    },
    { 
      key: CallOutcomeStatus.CAIXA_POSTAL, 
      label: 'Caixa Postal', 
      icon: Voicemail, 
      color: 'text-blue-400 border-blue-500/30 bg-blue-500/10 hover:border-blue-500' 
    },
    { 
      key: CallOutcomeStatus.SEM_INTERESSE, 
      label: 'Sem Interesse / Perdido', 
      icon: UserX, 
      color: 'text-red-400 border-red-500/30 bg-red-500/10 hover:border-red-500' 
    },
    { 
      key: CallOutcomeStatus.REUNIAO_AGENDADA, 
      label: 'Reagendada / Reunião', 
      icon: CalendarCheck, 
      color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10 hover:border-emerald-500' 
    },
  ];

  const handleSubmit = async () => {
    if (!selectedStatus || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await submitDisposition(selectedStatus as any, notes);
      setSelectedStatus(null);
      setNotes('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-3xl bg-[#111513] border border-[#26332B] p-6 space-y-5 shadow-[0_0_50px_rgba(0,0,0,0.9)] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#26332B] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#57EF40] shadow-[0_0_8px_#57EF40] animate-pulse" />
              <h3 className="text-base font-extrabold text-white tracking-tight">
                Tabulação Rápida da Chamada
              </h3>
              {isPowerDialerActive && (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#57EF40]/15 text-[#57EF40] border border-[#57EF40]/30 flex items-center gap-1">
                  <Layers className="w-3 h-3" /> Power Dialer
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Classifique o contato com <strong className="text-[#57EF40]">{activeLead?.name || 'Lead'}</strong> ({activeLead?.company || 'Contato'})
            </p>
          </div>
          <button 
            onClick={closeDisposition} 
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-[#18201C] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Outcome Selection Grid */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
            Desfecho da Ligação:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {outcomes.map((item) => {
              const Icon = item.icon;
              const isSelected = selectedStatus === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setSelectedStatus(item.key)}
                  className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left text-xs font-bold transition-all ${
                    isSelected
                      ? 'border-[#57EF40] bg-[#57EF40]/15 text-[#57EF40] shadow-[0_0_16px_rgba(87,239,64,0.25)] ring-1 ring-[#57EF40]'
                      : 'border-[#26332B] bg-[#18201C] hover:bg-[#202B25] text-white hover:border-[#57EF40]/40'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-[#57EF40]' : item.color.split(' ')[0]}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-400 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-[#57EF40]" />
            <span>Notas da Ligação:</span>
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: Decisor pediu envio de minuta contratual para quinta-feira..."
            className="w-full bg-[#18201C] border border-[#26332B] focus:border-[#57EF40] rounded-2xl p-3 text-xs text-white placeholder:text-gray-500 outline-none resize-none transition-all focus:shadow-[0_0_12px_rgba(87,239,64,0.15)]"
          />
        </div>

        {/* Proactive AI Follow-up Trigger Banner */}
        <div className="p-3.5 rounded-2xl bg-[#18201C] border border-[#26332B] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#57EF40]/10 text-[#57EF40] flex items-center justify-center shrink-0 border border-[#57EF40]/25">
              <MessageSquareShare className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#57EF40]" />
                Automação de Follow-up WhatsApp
              </p>
              <p className="text-[11px] text-gray-400">
                Se não atendeu, agenda mensagem automática no WhatsApp do lead.
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={autoFollowup}
            onChange={(e) => setAutoFollowup(e.target.checked)}
            className="w-4 h-4 accent-[#57EF40] rounded cursor-pointer shrink-0"
          />
        </div>

        {/* Power Dialer Notice */}
        {isPowerDialerActive && (
          <p className="text-[11px] text-[#57EF40] font-mono text-center font-bold">
            ⚡ Ao confirmar, o sistema aguardará 3 segundos e discará o próximo lead da fila.
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#26332B]">
          <button
            type="button"
            onClick={closeDisposition}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-400 hover:text-white transition-colors"
          >
            Pular Tabulação
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!selectedStatus || isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#57EF40] to-[#3CD427] hover:brightness-110 disabled:opacity-40 text-[#070908] font-black text-xs shadow-[0_0_20px_rgba(87,239,64,0.35)] hover:shadow-[0_0_28px_rgba(87,239,64,0.5)] transition-all active:scale-95"
          >
            {isSubmitting ? 'Salvando...' : 'Confirmar e Prosseguir'}
          </button>
        </div>
      </div>
    </div>
  );
}
