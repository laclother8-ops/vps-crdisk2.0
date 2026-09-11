'use client';

import React, { useState } from 'react';
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Pause, 
  Play, 
  X, 
  Delete, 
  User, 
  Building, 
  Activity,
  PhoneForwarded,
  Layers,
  ArrowRight,
  Grid,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { useSoftphoneStore } from '../../stores/useSoftphoneStore';
import { formatPhone } from '../../lib/utils';

export function FloatingSoftphone() {
  const {
    isOpen,
    toggleOpen,
    status,
    activeLead,
    callDuration,
    dialpadInput,
    appendDialpad,
    clearDialpad,
    setDialpadInput,
    isMuted,
    toggleMute,
    isHeld,
    toggleHold,
    isTransferOpen,
    toggleTransfer,
    isDTMFOpen,
    toggleDTMF,
    sendDTMF,
    transferCall,
    startCall,
    endCall,
    isPowerDialerActive,
    powerDialerSession
  } = useSoftphoneStore();

  const [transferTarget, setTransferTarget] = useState('');

  const keypadButtons = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  const handleExecuteTransfer = async () => {
    if (!transferTarget.trim()) return;
    await transferCall(transferTarget.trim());
    setTransferTarget('');
  };

  const isCallActive = status === 'IN_CALL' || status === 'RINGING' || status === 'DIALING';

  // If closed, render a sleek floating action button in bottom-right corner
  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={toggleOpen}
          className={`flex items-center gap-3 p-3.5 rounded-full transition-all duration-300 shadow-2xl ${
            isCallActive
              ? 'bg-[#111513] border-2 border-[#57EF40] shadow-[0_0_30px_rgba(87,239,64,0.4)] animate-pulse px-5'
              : 'bg-[#111513] hover:bg-[#18201C] border border-[#26332B] hover:border-[#57EF40]/60 hover:shadow-[0_0_20px_rgba(87,239,64,0.25)] text-[#57EF40]'
          }`}
          title={isCallActive ? 'Chamada em curso - Clique para expandir' : 'Abrir Smart Dialer WebRTC'}
        >
          <div className="relative flex items-center justify-center">
            <Phone className={`w-5 h-5 ${isCallActive ? 'text-[#57EF40] fill-current animate-bounce' : 'text-[#57EF40]'}`} />
            {isCallActive && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#57EF40] ring-2 ring-[#111513] animate-ping" />
            )}
          </div>

          {isCallActive && (
            <div className="flex flex-col text-left pr-1">
              <span className="text-[11px] font-bold text-white max-w-[120px] truncate">
                {activeLead?.name || 'Em Chamada'}
              </span>
              <span className="text-[10px] font-mono text-[#57EF40] font-bold">
                {status === 'IN_CALL' ? formatTimer(callDuration) : 'Chamando...'}
              </span>
            </div>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-84 sm:w-96 rounded-3xl bg-[#111513] border border-[#26332B] shadow-[0_0_50px_rgba(0,0,0,0.8)] z-50 overflow-hidden flex flex-col transition-all animate-in slide-in-from-bottom-5 duration-200">
      {/* Softphone Header */}
      <div className="px-5 py-3.5 bg-[#18201C] border-b border-[#26332B] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`w-2.5 h-2.5 rounded-full ${isCallActive ? 'bg-[#57EF40] shadow-[0_0_8px_#57EF40] animate-ping' : 'bg-[#57EF40]'}`} />
          <h3 className="font-extrabold text-xs text-white tracking-wide flex items-center gap-2">
            CRDISK SMART DIALER
            <span className="text-[10px] text-[#57EF40] font-mono font-bold px-2 py-0.5 rounded-md bg-[#111513] border border-[#26332B]">
              SIP: 1001
            </span>
          </h3>
        </div>
        
        <div className="flex items-center gap-1.5">
          {/* Power Dialer Queue indicator */}
          {isPowerDialerActive && powerDialerSession && (
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#57EF40]/10 text-[#57EF40] border border-[#57EF40]/30 flex items-center gap-1">
              <Layers className="w-3 h-3" />
              {powerDialerSession.currentIndex + 1}/{powerDialerSession.queue.length}
            </span>
          )}

          <button
            onClick={toggleOpen}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-[#111513] transition-colors"
            title="Minimizar Softphone"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main State View */}
      <div className="p-5 space-y-4">
        {isCallActive ? (
          /* Active Call State */
          <div className="text-center py-3 space-y-4">
            {/* Pulsing Avatar / Glow Indicator */}
            <div className="relative inline-flex items-center justify-center">
              {status === 'IN_CALL' && (
                <div className="absolute w-24 h-24 rounded-full bg-[#57EF40]/10 animate-ping pointer-events-none" />
              )}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#57EF40] to-[#65C556] flex items-center justify-center text-[#070908] text-xl font-extrabold shadow-[0_0_24px_rgba(87,239,64,0.35)]">
                {activeLead?.name ? activeLead.name.charAt(0).toUpperCase() : <User className="w-7 h-7" />}
              </div>
            </div>

            <div>
              <h4 className="font-extrabold text-base text-white">{activeLead?.name || 'Chamada em Curso'}</h4>
              <p className="text-xs text-gray-400 flex items-center justify-center gap-1 mt-0.5">
                <Building className="w-3 h-3 text-gray-500" />
                {activeLead?.company || 'Contato Direto'}
              </p>
              <p className="text-sm font-mono text-[#57EF40] font-bold mt-1">
                {formatPhone(activeLead?.phone || dialpadInput)}
              </p>
            </div>

            {/* Call Status & Prominent Monospace Timer */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#18201C] border border-[#26332B] text-xs font-mono">
              <Activity className="w-3.5 h-3.5 text-[#57EF40] animate-pulse" />
              {status === 'IN_CALL' ? (
                <span className="text-[#57EF40] font-bold text-sm tracking-wider">{formatTimer(callDuration)}</span>
              ) : status === 'RINGING' ? (
                <span className="text-amber-400 font-semibold animate-pulse">Chamando...</span>
              ) : (
                <span className="text-gray-400">Conectando WebRTC...</span>
              )}
            </div>

            {/* DTMF Keypad Panel during Active Call */}
            {isDTMFOpen && (
              <div className="p-3 bg-[#18201C] border border-[#26332B] rounded-2xl space-y-2 text-center animate-in fade-in zoom-in-95">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Teclado DTMF (Envio de Dígitos)
                </span>
                <div className="grid grid-cols-3 gap-1.5 max-w-[200px] mx-auto">
                  {keypadButtons.map((btn) => (
                    <button
                      key={btn}
                      onClick={() => sendDTMF(btn)}
                      className="h-9 rounded-xl bg-[#111513] hover:bg-[#202B25] active:scale-95 border border-[#26332B] hover:border-[#57EF40]/60 text-sm font-mono font-bold text-white hover:text-[#57EF40] transition-all"
                    >
                      {btn}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Transfer Popover / Bar */}
            {isTransferOpen && (
              <div className="p-3.5 bg-[#18201C] border border-[#26332B] rounded-2xl space-y-2.5 text-left animate-in fade-in zoom-in-95">
                <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
                  <PhoneForwarded className="w-3.5 h-3.5 text-[#57EF40]" />
                  Transferir Chamada:
                </span>
                
                {/* Quick Extensions */}
                <div className="flex flex-wrap gap-1.5">
                  {['1002 (Sofia IA)', '1003 (Gerência)', '1004 (Suporte)'].map((ext) => (
                    <button
                      key={ext}
                      onClick={() => setTransferTarget(ext.split(' ')[0])}
                      className="px-2.5 py-1 rounded-lg bg-[#111513] text-[10px] font-mono text-[#57EF40] border border-[#26332B] hover:border-[#57EF40]/50"
                    >
                      {ext}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ramal ou número..."
                    value={transferTarget}
                    onChange={(e) => setTransferTarget(e.target.value)}
                    className="flex-1 bg-[#111513] border border-[#26332B] rounded-xl px-3 py-1.5 text-xs text-white font-mono outline-none focus:border-[#57EF40]"
                  />
                  <button
                    onClick={handleExecuteTransfer}
                    disabled={!transferTarget.trim()}
                    className="px-3.5 py-1.5 rounded-xl bg-[#57EF40] text-[#070908] font-bold text-xs shadow-[0_0_12px_rgba(87,239,64,0.3)] flex items-center gap-1 disabled:opacity-40"
                  >
                    <span>Transferir</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {/* In-Call Controls: Mute, Hold, DTMF, Transfer, Hangup */}
            <div className="flex items-center justify-center gap-2.5 pt-2">
              {/* Mute */}
              <button
                onClick={toggleMute}
                className={`p-3 rounded-2xl border transition-all ${
                  isMuted
                    ? 'bg-red-500/20 border-red-500 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.2)]'
                    : 'bg-[#18201C] hover:bg-[#202B25] border-[#26332B] text-gray-300 hover:text-[#57EF40] hover:border-[#57EF40]/40'
                }`}
                title={isMuted ? 'Desmutar Microfone' : 'Mutar Microfone'}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* Hold */}
              <button
                onClick={toggleHold}
                className={`p-3 rounded-2xl border transition-all ${
                  isHeld
                    ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                    : 'bg-[#18201C] hover:bg-[#202B25] border-[#26332B] text-gray-300 hover:text-[#57EF40] hover:border-[#57EF40]/40'
                }`}
                title={isHeld ? 'Retomar Chamada' : 'Pausar/Reter Chamada (Hold)'}
              >
                {isHeld ? <Play className="w-5 h-5 text-amber-400" /> : <Pause className="w-5 h-5" />}
              </button>

              {/* DTMF Keypad Toggle */}
              <button
                onClick={toggleDTMF}
                className={`p-3 rounded-2xl border transition-all ${
                  isDTMFOpen
                    ? 'bg-[#57EF40]/20 border-[#57EF40] text-[#57EF40] shadow-[0_0_12px_rgba(87,239,64,0.2)]'
                    : 'bg-[#18201C] hover:bg-[#202B25] border-[#26332B] text-gray-300 hover:text-[#57EF40] hover:border-[#57EF40]/40'
                }`}
                title="Teclado Numérico DTMF"
              >
                <Grid className="w-5 h-5" />
              </button>

              {/* Transfer */}
              <button
                onClick={toggleTransfer}
                className={`p-3 rounded-2xl border transition-all ${
                  isTransferOpen
                    ? 'bg-[#57EF40]/20 border-[#57EF40] text-[#57EF40] shadow-[0_0_12px_rgba(87,239,64,0.2)]'
                    : 'bg-[#18201C] hover:bg-[#202B25] border-[#26332B] text-gray-300 hover:text-[#57EF40] hover:border-[#57EF40]/40'
                }`}
                title="Transferir Chamada"
              >
                <PhoneForwarded className="w-5 h-5" />
              </button>

              {/* Hangup Button (Red) */}
              <button
                onClick={endCall}
                className="p-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold transition-all shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:shadow-[0_0_28px_rgba(239,68,68,0.6)] flex items-center justify-center active:scale-95"
                title="Encerrar Chamada e Abrir Tabulação"
              >
                <PhoneOff className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          /* Idle / Dialpad State */
          <div className="space-y-4">
            {/* Number Input Display */}
            <div className="relative">
              <input
                type="text"
                value={dialpadInput}
                onChange={(e) => setDialpadInput(e.target.value)}
                placeholder="Digite o número ou ramal..."
                className="w-full bg-[#18201C] border border-[#26332B] focus:border-[#57EF40] rounded-2xl px-4 py-3 text-center text-lg font-mono text-[#57EF40] font-bold placeholder:text-gray-500 outline-none transition-all focus:shadow-[0_0_15px_rgba(87,239,64,0.2)]"
              />
              {dialpadInput && (
                <button
                  onClick={clearDialpad}
                  className="absolute right-3.5 top-3.5 text-gray-400 hover:text-white"
                  title="Limpar número"
                >
                  <Delete className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Keypad Grid (Pill Buttons with Neon Glow) */}
            <div className="grid grid-cols-3 gap-2.5">
              {keypadButtons.map((btn) => (
                <button
                  key={btn}
                  onClick={() => appendDialpad(btn)}
                  className="h-12 rounded-2xl bg-[#18201C] hover:bg-[#202B25] active:scale-95 border border-[#26332B] hover:border-[#57EF40]/60 hover:shadow-[0_0_12px_rgba(87,239,64,0.15)] text-lg font-mono font-bold text-white hover:text-[#57EF40] transition-all flex items-center justify-center"
                >
                  {btn}
                </button>
              ))}
            </div>

            {/* Call Button (Gradient Green #57EF40 -> #3CD427) */}
            <button
              onClick={() => {
                if (dialpadInput) {
                  startCall({
                    id: `manual-lead-${Date.now()}`,
                    orgId: '11111111-1111-1111-1111-111111111111',
                    name: 'Chamada Manual',
                    phone: dialpadInput,
                    status: 'NAO_CONTATADO' as any,
                    funnelStage: 'NOVO_LEAD' as any,
                    optOut: false,
                    tags: ['Manual'],
                    score: 0,
                    createdAt: new Date(),
                    updatedAt: new Date()
                  });
                }
              }}
              disabled={!dialpadInput}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#57EF40] to-[#3CD427] hover:brightness-110 disabled:opacity-40 disabled:pointer-events-none text-[#070908] font-black text-sm flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(87,239,64,0.35)] hover:shadow-[0_0_32px_rgba(87,239,64,0.5)] transition-all active:scale-[0.98]"
            >
              <Phone className="w-4 h-4 fill-current" />
              <span>Iniciar Chamada WebRTC</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
