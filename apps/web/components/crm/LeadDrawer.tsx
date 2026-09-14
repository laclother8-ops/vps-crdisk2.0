'use client';

import React, { useState } from 'react';
import { 
  X, 
  Phone, 
  Mail, 
  Building, 
  Flame, 
  MessageSquare, 
  CheckCircle, 
  Clock, 
  Tag, 
  Bot, 
  UserCheck, 
  Send, 
  Play, 
  Pause, 
  Volume2, 
  Calendar, 
  FileText, 
  AlertCircle,
  PhoneForwarded,
  Copy,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { useCRMStore } from '../../stores/useCRMStore';
import { useSoftphoneStore } from '../../stores/useSoftphoneStore';
import { formatCurrency, formatPhone, formatRelativeTime } from '../../lib/utils';
import { FunnelStage, LeadContactStatus } from '@omnicrm/shared';

export function LeadDrawer() {
  const { 
    selectedLead, 
    selectedLeadTimeline, 
    isLoadingTimeline, 
    isLeadDrawerOpen, 
    closeLeadDrawer,
    addNoteToLead,
    updateLead,
    toggleLeadAI,
    moveDeal
  } = useCRMStore();

  const { startCall } = useSoftphoneStore();

  const [noteContent, setNoteContent] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [isEditingValue, setIsEditingValue] = useState(false);
  const [editDealValue, setEditDealValue] = useState<number>(15000);

  if (!isLeadDrawerOpen || !selectedLead) return null;

  const isHumanActive = (selectedLead.status as string) === 'em_atendimento_humano' || (selectedLead.status as string) === 'EM_ATENDIMENTO';

  const handleToggleAI = async () => {
    await toggleLeadAI(selectedLead.id, !isHumanActive);
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim() || isSubmittingNote) return;

    setIsSubmittingNote(true);
    try {
      await addNoteToLead(selectedLead.id, noteContent.trim());
      setNoteContent('');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleCopyPhone = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(selectedLead.phone);
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    }
  };

  const handleSaveDealValue = async () => {
    await updateLead(selectedLead.id, { dealValue: Number(editDealValue) });
    setIsEditingValue(false);
  };

  const handleStageChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStage = e.target.value as FunnelStage;
    await moveDeal(selectedLead.id, newStage);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Drawer Overlay Backdrop */}
      <div className="absolute inset-0" onClick={closeLeadDrawer} />

      {/* Sheet Content */}
      <div className="relative w-full max-w-xl h-full bg-[#111513] border-l border-[#26332B] shadow-[0_0_50px_rgba(0,0,0,0.8)] z-10 flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300">
        
        {/* Top Header */}
        <div className="p-6 border-b border-[#26332B] bg-[#111513]/90 backdrop-blur-md shrink-0 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              <div className="relative">
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-background font-black text-xl shadow-[0_0_20px_rgba(87,239,64,0.35)]">
                  {selectedLead.name.charAt(0).toUpperCase()}
                </div>
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-primary border-2 border-[#111513] shadow-[0_0_8px_#57EF40]" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-extrabold text-lg text-foreground tracking-tight">{selectedLead.name}</h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#18201C] border border-[#26332B] text-primary">
                    ID: {selectedLead.id.slice(-6)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                  <Building className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>{selectedLead.company || 'Pessoa Física'}</span>
                </p>
              </div>
            </div>

            <button 
              onClick={closeLeadDrawer} 
              className="text-muted-foreground hover:text-foreground p-2 rounded-xl bg-[#18201C] hover:bg-[#202B25] border border-[#26332B] transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Action Header: 3 Quick Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            {/* 1. Ligar Softphone */}
            <button
              onClick={() => startCall(selectedLead)}
              className="flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-[#57EF40] to-[#3CD427] text-[#070908] text-xs font-black shadow-[0_0_20px_rgba(87,239,64,0.35)] hover:shadow-[0_0_28px_rgba(87,239,64,0.5)] hover:brightness-110 active:scale-95 transition-all"
              title="Ligar via Smart Dialer (WebRTC)"
            >
              <Phone className="w-4 h-4 fill-current" />
              <span>Ligar</span>
            </button>

            {/* 2. Abrir Chat WhatsApp */}
            <a
              href={`/chat?leadId=${selectedLead.id}`}
              className="flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-xl bg-[#18201C] hover:bg-[#202B25] text-[#57EF40] border border-[#26332B] hover:border-[#57EF40]/50 text-xs font-bold transition-all shadow-sm"
              title="Abrir Chat WhatsApp Direto"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Abrir Chat WhatsApp</span>
            </a>

            {/* 3. Toggle/Switch: Agente IA Ativo */}
            <button
              onClick={handleToggleAI}
              className={`flex items-center justify-center gap-2.5 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                !isHumanActive
                  ? 'bg-[#57EF40]/10 border-[#57EF40] text-[#57EF40] shadow-[0_0_16px_rgba(87,239,64,0.3)]'
                  : 'bg-amber-500/10 border-amber-500/40 text-amber-400 hover:border-amber-500'
              }`}
              title="Pausar ou Retomar Atendimento Automático do Agente IA"
            >
              {!isHumanActive ? (
                <>
                  <div className="relative">
                    <Bot className="w-4 h-4 text-[#57EF40]" />
                    <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[#57EF40] animate-ping" />
                  </div>
                  <span>Agente IA Ativo</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4 text-amber-400" />
                  <span>Modo Humano</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Center Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
          
          {/* Quick Data Grid & Stage */}
          <div className="p-4 rounded-2xl bg-[#18201C] border border-[#26332B] space-y-4">
            <div className="flex items-center justify-between border-b border-[#26332B] pb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                Dados do Lead
              </span>
              
              {/* Funnel Stage Selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground">Etapa:</span>
                <select
                  value={selectedLead.funnelStage || FunnelStage.NOVO_LEAD}
                  onChange={handleStageChange}
                  className="bg-[#111513] border border-[#26332B] focus:border-primary text-primary text-xs font-bold rounded-lg px-2 py-1 outline-none cursor-pointer"
                >
                  <option value={FunnelStage.NOVO_LEAD}>Novo Lead</option>
                  <option value={FunnelStage.QUALIFICACAO}>Em Qualificação</option>
                  <option value={FunnelStage.PROPOSTA}>Proposta Enviada</option>
                  <option value={FunnelStage.FOLLOWUP_ATIVO}>Follow-up Ativo</option>
                  <option value={FunnelStage.FECHADO_GANHO}>Fechado / Ganho</option>
                  <option value={FunnelStage.PERDIDO}>Perdido</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              {/* Telefone */}
              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Telefone</span>
                <div className="flex items-center justify-between p-2 rounded-xl bg-[#111513] border border-[#26332B]">
                  <div className="flex items-center gap-2 text-foreground font-mono font-medium">
                    <Phone className="w-3.5 h-3.5 text-primary" />
                    <span>{formatPhone(selectedLead.phone)}</span>
                  </div>
                  <button 
                    onClick={handleCopyPhone}
                    className="text-muted-foreground hover:text-primary p-1 rounded transition-colors"
                    title="Copiar número"
                  >
                    {copiedPhone ? <CheckCircle className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">E-mail</span>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-[#111513] border border-[#26332B] text-foreground truncate">
                  <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="truncate">{selectedLead.email || 'Não informado'}</span>
                </div>
              </div>

              {/* Valor Oportunidade */}
              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Valor Oportunidade</span>
                <div className="flex items-center justify-between p-2 rounded-xl bg-[#111513] border border-[#26332B]">
                  {isEditingValue ? (
                    <div className="flex items-center gap-1.5 w-full">
                      <input
                        type="number"
                        value={editDealValue}
                        onChange={(e) => setEditDealValue(Number(e.target.value))}
                        className="w-full bg-transparent text-xs font-mono font-bold text-primary outline-none"
                        autoFocus
                      />
                      <button 
                        onClick={handleSaveDealValue}
                        className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary text-[#070908]"
                      >
                        Salvar
                      </button>
                    </div>
                  ) : (
                    <div 
                      onClick={() => {
                        setEditDealValue(Number(selectedLead.dealValue || 15000));
                        setIsEditingValue(true);
                      }}
                      className="flex items-center justify-between w-full cursor-pointer group"
                    >
                      <div className="flex items-center gap-2 text-primary font-mono font-bold">
                        <Tag className="w-3.5 h-3.5 text-primary" />
                        <span>{formatCurrency(Number(selectedLead.dealValue || 15000))}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground group-hover:text-primary transition-colors">Editar</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Lead Score */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase font-bold">
                  <span>Lead Score</span>
                  <span className="text-primary font-mono">{selectedLead.score || 75}/100</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#111513] border border-[#26332B] flex items-center gap-2">
                  <Flame className="w-3.5 h-3.5 text-primary shrink-0" />
                  <div className="flex-1 bg-[#202B25] h-2 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-secondary rounded-full shadow-[0_0_8px_#57EF40]"
                      style={{ width: `${Math.min(100, selectedLead.score || 75)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Tags */}
            {selectedLead.tags && selectedLead.tags.length > 0 && (
              <div className="pt-2 border-t border-[#26332B]">
                <div className="flex flex-wrap gap-1.5">
                  {selectedLead.tags.map((t, idx) => (
                    <span 
                      key={idx} 
                      className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-[#111513] text-primary border border-[#26332B]"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Note Input Box */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-primary" />
              <span>Nova Anotação Interna</span>
            </h4>
            <form onSubmit={handleAddNote} className="space-y-2">
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Escreva uma anotação de alinhamento ou resumo de contato..."
                rows={2}
                className="w-full bg-[#18201C] border border-[#26332B] focus:border-primary rounded-xl p-3 text-xs text-foreground placeholder:text-muted-foreground outline-none resize-none transition-colors"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!noteContent.trim() || isSubmittingNote}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-primary text-[#070908] text-xs font-extrabold disabled:opacity-40 hover:brightness-110 active:scale-95 transition-all shadow-[0_0_12px_rgba(87,239,64,0.2)]"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmittingNote ? 'Salvando...' : 'Adicionar Nota'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Unified Chronological Timeline */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#26332B] pb-2">
              <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span>Linha do Tempo de Interações</span>
              </h4>
              <span className="text-[10px] font-mono text-muted-foreground">
                {selectedLeadTimeline.length} registros
              </span>
            </div>

            {isLoadingTimeline ? (
              <div className="py-12 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span>Carregando histórico do lead...</span>
              </div>
            ) : selectedLeadTimeline.length > 0 ? (
              <div className="relative pl-4 space-y-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#26332B]">
                {selectedLeadTimeline.map((item, idx) => {
                  const isCall = item.type === 'call';
                  const isMsg = item.type === 'message';
                  const isNote = item.type === 'note';

                  return (
                    <div key={item.id || idx} className="relative group">
                      {/* Timeline Dot */}
                      <span className={`absolute -left-[19px] top-1 w-3 h-3 rounded-full border-2 border-[#111513] ${
                        isCall ? 'bg-primary shadow-[0_0_8px_#57EF40]' :
                        isMsg ? 'bg-secondary' : 'bg-emerald-400'
                      }`} />

                      <div className="p-3.5 rounded-2xl bg-[#18201C] border border-[#26332B] hover:border-border-hover transition-colors space-y-2">
                        {/* Header */}
                        <div className="flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-1.5 font-bold">
                            {isCall && <Phone className="w-3.5 h-3.5 text-primary" />}
                            {isMsg && <MessageSquare className="w-3.5 h-3.5 text-secondary" />}
                            {isNote && <FileText className="w-3.5 h-3.5 text-emerald-400" />}
                            <span className="text-foreground">{item.title}</span>
                          </div>
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {formatRelativeTime(item.timestamp)}
                          </span>
                        </div>

                        {/* Content text */}
                        <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                          {item.content}
                        </p>

                        {/* Call Recording Player (Mock) */}
                        {isCall && (item.audioUrl || item.duration > 0) && (
                          <div className="p-2.5 rounded-xl bg-[#111513] border border-[#26332B] flex items-center justify-between gap-3">
                            <button
                              onClick={() => setPlayingAudioId(playingAudioId === item.id ? null : item.id)}
                              className="w-7 h-7 rounded-lg bg-primary/20 hover:bg-primary text-primary hover:text-background flex items-center justify-center transition-all"
                            >
                              {playingAudioId === item.id ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                            </button>

                            <div className="flex-1 space-y-1">
                              <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Volume2 className="w-3 h-3 text-primary" /> Gravação da Ligação
                                </span>
                                <span>{item.duration ? `${item.duration}s` : '01:45'}</span>
                              </div>
                              <div className="h-1.5 bg-[#202B25] rounded-full overflow-hidden">
                                <div 
                                  className={`h-full bg-primary ${playingAudioId === item.id ? 'w-2/3 animate-pulse' : 'w-1/4'}`} 
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-10 text-center border-2 border-dashed border-[#26332B] rounded-2xl">
                <p className="text-xs text-muted-foreground">Nenhuma interação registrada ainda.</p>
                <p className="text-[11px] text-muted-foreground/60 mt-1">Ligue via softphone ou adicione uma anotação acima.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#26332B] bg-[#111513] shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span>CRDISK Tenant Engine</span>
          </div>

          <button
            onClick={closeLeadDrawer}
            className="px-4 py-2 rounded-xl bg-[#18201C] hover:bg-[#202B25] text-muted-foreground hover:text-foreground text-xs font-bold border border-[#26332B] transition-colors"
          >
            Fechar Gaveta
          </button>
        </div>
      </div>
    </div>
  );
}
