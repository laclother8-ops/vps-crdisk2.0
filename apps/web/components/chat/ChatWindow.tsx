'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Phone, 
  Bot, 
  User, 
  Sparkles, 
  Check, 
  CheckCheck, 
  Paperclip, 
  Mic, 
  Play, 
  Pause, 
  ShieldAlert, 
  FileText, 
  X, 
  Users, 
  Zap, 
  Radio, 
  Wifi 
} from 'lucide-react';
import { useChatStore } from '../../stores/useChatStore';
import { useSoftphoneStore } from '../../stores/useSoftphoneStore';
import { formatPhone } from '../../lib/utils';
import { MessageChannel, MessageSender, MessageType } from '@omnicrm/shared';
import { TransferModal } from './TransferModal';
import { TemplatesPopover } from './TemplatesPopover';

// Waveform Audio Bubble Component
function AudioPlayerBubble({ 
  duration = 15, 
  isSentByUs = false,
  isAI = false
}: { 
  duration?: number; 
  isSentByUs?: boolean; 
  isAI?: boolean;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 10;
        });
      }, 300);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const togglePlay = () => setIsPlaying(!isPlaying);

  const bars = [18, 40, 65, 80, 50, 90, 70, 45, 85, 95, 60, 30, 75, 55, 90, 40, 25];

  return (
    <div className="flex items-center gap-3 py-1 px-2 rounded-2xl min-w-[220px]">
      {/* Play/Pause Button */}
      <button
        type="button"
        onClick={togglePlay}
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all ${
          isSentByUs 
            ? 'bg-[#57EF40] text-[#070908] shadow-glow-green-sm' 
            : 'bg-[#57EF40] text-[#070908] shadow-glow-green'
        }`}
      >
        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
      </button>

      {/* Waveform Visualization */}
      <div className="flex-1 flex items-center gap-1 h-8 cursor-pointer" onClick={togglePlay}>
        {bars.map((height, i) => {
          const isFilled = (i / bars.length) * 100 <= progress;
          return (
            <span
              key={i}
              style={{ height: `${height}%` }}
              className={`w-1 rounded-full transition-all duration-150 ${
                isFilled
                  ? 'bg-[#57EF40]'
                  : 'bg-[#26332B]'
              }`}
            />
          );
        })}
      </div>

      {/* Audio Timer */}
      <span className="text-[10px] font-mono font-bold text-[#57EF40] shrink-0">
        0:{duration < 10 ? `0${duration}` : duration}
      </span>
    </div>
  );
}

export function ChatWindow() {
  const { 
    conversations, 
    selectedLeadId, 
    messages, 
    sendMessage, 
    toggleHumanMode,
    fetchTemplates,
    isTemplatesOpen,
    setIsTemplatesOpen,
    setIsTransferModalOpen,
    notifyTyping
  } = useChatStore();
  
  const { startCall } = useSoftphoneStore();
  
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [attachedFile, setAttachedFile] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingDebounceRef = useRef<any>(null);

  const selectedConv = conversations.find((c) => c.leadId === selectedLeadId);
  const currentMessages = selectedLeadId ? messages[selectedLeadId] || [] : [];
  const isHumanMode = selectedConv?.isHumanHandled || selectedConv?.lead?.status === ('em_atendimento_humano' as any);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages]);

  // Audio recording timer simulation
  useEffect(() => {
    let timer: any;
    if (isRecording) {
      timer = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    
    // Auto-detect typing and notify backend to trigger human handoff
    if (selectedLeadId) {
      if (typingDebounceRef.current) clearTimeout(typingDebounceRef.current);
      typingDebounceRef.current = setTimeout(() => {
        notifyTyping(selectedLeadId);
      }, 400);
    }
  };

  if (!selectedConv) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-muted-foreground bg-[#070908]/50">
        <Bot className="w-12 h-12 text-[#57EF40]/40 mb-3 animate-pulse" />
        <p className="text-xs">Selecione uma conversa ao lado para abrir o atendimento.</p>
      </div>
    );
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !attachedFile) return;
    
    const text = attachedFile ? `[Anexo: ${attachedFile}] ${inputText}` : inputText;
    setInputText('');
    setAttachedFile(null);
    await sendMessage(text, selectedConv.channel, 'text');
  };

  const handleSendVoiceNote = async () => {
    setIsRecording(false);
    await sendMessage(
      '[Mensagem de Áudio WhatsApp]',
      selectedConv.channel,
      'audio',
      'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3',
      recordingSeconds > 0 ? recordingSeconds : 8
    );
  };

  const handleAttachMockFile = () => {
    setAttachedFile('Proposta_Comercial_CRDISK.pdf');
  };

  const handleSelectTemplate = (text: string) => {
    setInputText(text);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#070908] relative overflow-hidden">
      {/* Transfer Modal Mount */}
      <TransferModal />

      {/* Header */}
      <div className="h-16 px-6 border-b border-[#26332B] bg-[#111513] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#18201C] border border-[#57EF40]/40 flex items-center justify-center text-[#57EF40] font-bold text-sm shadow-glow-green-sm">
            {selectedConv.lead?.name ? selectedConv.lead.name.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2">
              {selectedConv.lead?.name || 'Cliente'}
              {selectedConv.lead?.company && (
                <span className="text-xs font-normal text-muted-foreground">({selectedConv.lead.company})</span>
              )}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] text-[#57EF40] font-mono font-semibold">
                {formatPhone(selectedConv.lead?.phone || '')}
              </span>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#57EF40]/10 text-[#57EF40] border border-[#57EF40]/20 flex items-center gap-1">
                <Wifi className="w-2.5 h-2.5 text-[#57EF40]" />
                WhatsApp Cloud API Conectado
              </span>
            </div>
          </div>
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-2.5">
          {/* Transfer Conversation Button */}
          <button
            type="button"
            onClick={() => setIsTransferModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#18201C] border border-[#26332B] hover:border-[#57EF40]/40 text-muted-foreground hover:text-foreground text-xs font-bold transition-all"
            title="Transferir atendimento para outro operador"
          >
            <Users className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Transferir</span>
          </button>

          {/* Mode Switch: Human vs AI */}
          <button
            onClick={() => toggleHumanMode(selectedConv.leadId, !isHumanMode)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              isHumanMode
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-400 shadow-sm'
                : 'bg-[#57EF40]/10 border-[#57EF40]/30 text-[#57EF40] shadow-glow-green-sm'
            }`}
          >
            {isHumanMode ? (
              <>
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>Atendimento Humano</span>
              </>
            ) : (
              <>
                <Bot className="w-3.5 h-3.5 text-[#57EF40] animate-pulse" />
                <span>Sofia IA Conectada</span>
              </>
            )}
          </button>

          {/* Click to Call Softphone WebRTC */}
          {selectedConv.lead && (
            <button
              onClick={() => startCall(selectedConv.lead!)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#57EF40] to-[#65C556] text-[#070908] text-xs font-black shadow-glow-green hover:opacity-95 transition-all active:scale-95"
              title="Ligar via Softphone WebRTC"
            >
              <Phone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Discar Agora</span>
            </button>
          )}
        </div>
      </div>

      {/* Human Takeover Business Rule Banner */}
      {isHumanMode && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-2 flex items-center justify-between text-xs text-amber-400 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
            <span>
              <strong>Atendimento Humano Ativo:</strong> As respostas automáticas da IA Sofia estão pausadas neste chat.
            </span>
          </div>
          <button
            onClick={() => toggleHumanMode(selectedConv.leadId, false)}
            className="text-[11px] underline font-bold hover:text-amber-300"
          >
            Devolver para Sofia IA
          </button>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        {currentMessages.map((msg) => {
          const isLead = msg.sender === MessageSender.LEAD;
          const isAI = msg.sender === MessageSender.AI;
          const isAudio = msg.type === 'audio';

          return (
            <div
              key={msg.id}
              className={`flex items-end gap-2.5 ${isLead ? 'justify-start' : 'justify-end'}`}
            >
              {isLead && (
                <div className="w-7 h-7 rounded-xl bg-[#18201C] border border-[#26332B] flex items-center justify-center text-[10px] text-[#57EF40] font-bold shrink-0 mb-1">
                  {selectedConv.lead?.name?.charAt(0) || 'C'}
                </div>
              )}

              {/* Message Bubble */}
              <div
                className={`max-w-md rounded-2xl p-4 space-y-2 shadow-md ${
                  isLead
                    ? 'bg-[#18201C] text-foreground rounded-bl-sm border border-[#26332B]'
                    : isAI
                    ? 'bg-[#1D2B22] text-foreground rounded-br-sm border border-[#57EF40]/30 shadow-glow-green-sm'
                    : 'bg-[#1D2B22] text-foreground rounded-br-sm border border-[#57EF40]/40 shadow-glow-green-sm'
                }`}
              >
                {/* Sender badge */}
                <div className="flex items-center justify-between gap-4 text-[10px] font-bold">
                  {isAI ? (
                    <span className="text-[#57EF40] flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#57EF40]/10 border border-[#57EF40]/20 font-mono">
                      <Sparkles className="w-3 h-3 text-[#57EF40] animate-pulse" /> 🤖 IA Sofia
                    </span>
                  ) : isLead ? (
                    <span className="text-muted-foreground">{selectedConv.lead?.name || 'Cliente'}</span>
                  ) : (
                    <span className="text-[#57EF40] font-bold flex items-center gap-1">
                      <User className="w-3 h-3 text-[#57EF40]" /> Atendente Humano
                    </span>
                  )}
                  <span className="font-mono text-[9px] text-muted-foreground">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Content: Audio Waveform or Text */}
                {isAudio ? (
                  <AudioPlayerBubble 
                    duration={msg.duration || 14} 
                    isSentByUs={!isLead} 
                    isAI={isAI} 
                  />
                ) : (
                  <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                )}

                {/* Delivery Status Indicator (Meta format) */}
                {!isLead && (
                  <div className="flex justify-end pt-0.5">
                    {msg.status === 'read' ? (
                      <span className="flex items-center gap-0.5 text-[#57EF40]" title="Lida pelo lead">
                        <CheckCheck className="w-3.5 h-3.5" />
                      </span>
                    ) : msg.status === 'delivered' ? (
                      <span className="flex items-center gap-0.5 text-muted-foreground" title="Entregue">
                        <CheckCheck className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="flex items-center gap-0.5 text-muted-foreground" title="Enviada">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                )}
              </div>

              {!isLead && (
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-[10px] font-bold shrink-0 mb-1 ${
                  isAI 
                    ? 'bg-[#18201C] border border-[#57EF40]/50 text-[#57EF40]' 
                    : 'bg-[#57EF40] text-[#070908] font-black'
                }`}>
                  {isAI ? <Bot className="w-4 h-4" /> : 'OP'}
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Attached File Preview */}
      {attachedFile && (
        <div className="px-6 py-2 bg-[#18201C] border-t border-[#26332B] flex items-center justify-between text-xs text-[#57EF40]">
          <div className="flex items-center gap-2 font-mono">
            <FileText className="w-4 h-4 text-[#57EF40]" />
            <span>{attachedFile}</span>
          </div>
          <button onClick={() => setAttachedFile(null)} className="text-muted-foreground hover:text-destructive">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Audio Recording Live State Bar */}
      {isRecording ? (
        <div className="p-4 bg-[#111513] border-t border-[#26332B] flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3 text-destructive font-bold text-xs">
            <span className="w-3 h-3 rounded-full bg-destructive animate-ping" />
            <span>Gravando áudio de voz para WhatsApp... ({recordingSeconds}s)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsRecording(false)}
              className="px-3 py-1.5 rounded-xl bg-[#18201C] text-muted-foreground text-xs hover:text-foreground"
            >
              Cancelar
            </button>
            <button
              onClick={handleSendVoiceNote}
              className="px-4 py-1.5 rounded-xl bg-[#57EF40] text-[#070908] font-black text-xs shadow-glow-green"
            >
              Enviar Áudio
            </button>
          </div>
        </div>
      ) : (
        /* Standard Input Bar */
        <div className="relative">
          {/* Canned Templates Popover Mount */}
          {isTemplatesOpen && (
            <TemplatesPopover
              onSelectTemplate={handleSelectTemplate}
              onClose={() => setIsTemplatesOpen(false)}
            />
          )}

          <form onSubmit={handleSend} className="p-4 bg-[#111513] border-t border-[#26332B] flex items-center gap-2.5">
            {/* Canned Responses Trigger */}
            <button
              type="button"
              onClick={() => setIsTemplatesOpen(!isTemplatesOpen)}
              className={`p-2.5 rounded-xl border transition-all ${
                isTemplatesOpen
                  ? 'bg-[#57EF40]/15 border-[#57EF40] text-[#57EF40] shadow-glow-green-sm'
                  : 'bg-[#18201C] border-[#26332B] text-muted-foreground hover:text-[#57EF40]'
              }`}
              title="Respostas Rápidas / Templates pré-gravados"
            >
              <Zap className="w-4 h-4" />
            </button>

            {/* Attachment Button */}
            <button
              type="button"
              onClick={handleAttachMockFile}
              className="p-2.5 rounded-xl bg-[#18201C] border border-[#26332B] text-muted-foreground hover:text-[#57EF40] transition-colors"
              title="Anexar arquivo / proposta"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Voice Note Button */}
            <button
              type="button"
              onClick={() => setIsRecording(true)}
              className="p-2.5 rounded-xl bg-[#18201C] border border-[#26332B] text-muted-foreground hover:text-[#57EF40] transition-colors"
              title="Gravar áudio de voz para WhatsApp"
            >
              <Mic className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={inputText}
              onChange={handleInputChange}
              placeholder={isHumanMode ? "Digite sua resposta ao lead (Atendimento Humano)..." : "Digite sua mensagem (Sofia IA assistindo)..."}
              className="flex-1 bg-[#070908] border border-[#26332B] focus:border-[#57EF40] rounded-2xl px-4 py-3 text-xs text-foreground placeholder:text-muted-foreground outline-none transition-all focus:shadow-glow-green-sm"
            />

            <button
              type="submit"
              disabled={!inputText.trim() && !attachedFile}
              className="p-3 rounded-2xl bg-gradient-to-r from-[#57EF40] to-[#65C556] hover:opacity-95 disabled:opacity-40 text-[#070908] font-black shadow-glow-green transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

