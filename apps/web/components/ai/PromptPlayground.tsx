'use client';

import React, { useState } from 'react';
import { 
  Send, 
  Bot, 
  Sparkles, 
  Wrench, 
  RefreshCw, 
  CheckCircle2, 
  Mic, 
  User, 
  ShieldAlert,
  ArrowRight,
  Database,
  CalendarCheck
} from 'lucide-react';
import { api } from '../../lib/api';

export function PromptPlayground() {
  const [testInput, setTestInput] = useState('Gostaria de agendar uma reunião comercial para quinta-feira às 15:00');
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    { role: 'assistant', content: 'Olá! Sou a Sofia, consultora do CRDISK. Como posso ajudar com sua operação de CRM, WhatsApp e discador hoje?' }
  ]);
  const [toolsExecuted, setToolsExecuted] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleRunTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testInput.trim() || isLoading) return;

    const userMsg = testInput;
    setTestInput('');
    setChatHistory((prev) => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const response = await api.testAgentChat(userMsg, chatHistory, {
        id: 'lead-test-101',
        name: 'Carlos Drummond',
        company: 'Varejo Plus',
        phone: '+5511976543210'
      });

      setChatHistory((prev) => [...prev, { role: 'assistant', content: response.reply }]);
      if (response.toolsExecuted?.length) {
        setToolsExecuted(response.toolsExecuted);
      }
    } catch (err) {
      console.error('Test chat error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSimulateWhisperAudio = async () => {
    setIsLoading(true);
    try {
      const transcribeRes = await api.transcribeAudio();
      const transcribedText = transcribeRes.text;
      setChatHistory((prev) => [...prev, { role: 'user', content: `🎙️ [Áudio Whisper]: "${transcribedText}"` }]);

      const response = await api.testAgentChat(transcribedText, chatHistory, {
        id: 'lead-test-101',
        name: 'Carlos Drummond',
        company: 'Varejo Plus',
        phone: '+5511976543210'
      });

      setChatHistory((prev) => [...prev, { role: 'assistant', content: response.reply }]);
      if (response.toolsExecuted?.length) {
        setToolsExecuted(response.toolsExecuted);
      }
    } catch (err) {
      console.error('Whisper simulation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-5 rounded-3xl glass-elevated border border-border space-y-4 shadow-glass-crdisk">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Simulador de Chat WhatsApp com Sofia IA (RAG & Tool Calling)
          </h3>
          <button
            onClick={() => {
              setChatHistory([{ role: 'assistant', content: 'Olá! Sou a Sofia, consultora do CRDISK. Como posso ajudar com sua operação de CRM, WhatsApp e discador hoje?' }]);
              setToolsExecuted([]);
            }}
            className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 p-1 rounded-lg"
          >
            <RefreshCw className="w-3 h-3" /> Reiniciar Histórico
          </button>
        </div>

        {/* Chat History Box (Last 8 messages context window) */}
        <div className="h-72 overflow-y-auto bg-background/80 border border-border rounded-2xl p-4 space-y-3 text-xs">
          {chatHistory.map((item, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-2.5 ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {item.role === 'assistant' && (
                <div className="w-6 h-6 rounded-xl bg-surface-elevated border border-primary/40 flex items-center justify-center text-primary shrink-0 mt-0.5 shadow-glow-green-sm">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}
              <div
                className={`p-3.5 rounded-2xl max-w-[85%] leading-relaxed ${
                  item.role === 'user'
                    ? 'bg-[#18201C] text-foreground border border-border rounded-br-sm'
                    : 'bg-[#1D2B22] text-foreground rounded-bl-sm border border-[#57EF40]/30 shadow-glow-green-sm'
                }`}
              >
                {item.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center gap-2 text-primary text-xs py-2 animate-pulse">
              <Sparkles className="w-4 h-4" />
              <span>Sofia consultando base vetorial pgvector e executando Function Calling...</span>
            </div>
          )}
        </div>

        {/* Tools Triggered Feedback Banner */}
        {toolsExecuted.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-surface border border-primary/30 text-xs space-y-1.5 animate-in fade-in">
            <div className="flex items-center gap-1.5 text-primary font-bold">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span>Ferramentas (Tools) Invocadas pelo Agente:</span>
            </div>
            {toolsExecuted.map((t, idx) => (
              <div key={idx} className="p-2 rounded-xl bg-background border border-border flex items-center justify-between text-[11px] font-mono">
                <span className="text-primary font-bold">⚡ {t.tool}</span>
                <span className="text-muted-foreground truncate max-w-xs">{JSON.stringify(t.args)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Input Bar & Whisper Voice Simulator */}
        <form onSubmit={handleRunTest} className="flex gap-2">
          <button
            type="button"
            onClick={handleSimulateWhisperAudio}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-surface-elevated hover:bg-primary/20 text-primary border border-border hover:border-primary transition-all flex items-center gap-1.5 text-xs font-bold"
            title="Simular envio de áudio e transcrição via Whisper"
          >
            <Mic className="w-4 h-4" />
            <span className="hidden sm:inline">Voz (Whisper)</span>
          </button>

          <input
            type="text"
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            placeholder="Digite sua dúvida ou instrua: 'Agendar call', 'Qual o preço?', 'Falar com humano'..."
            className="flex-1 bg-background border border-border focus:border-primary rounded-xl px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground outline-none"
          />

          <button
            type="submit"
            disabled={isLoading || !testInput.trim()}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary hover:from-primary-light hover:to-primary disabled:opacity-40 text-background font-extrabold text-xs shadow-glow-green flex items-center gap-1.5 transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Enviar</span>
          </button>
        </form>
      </div>
    </div>
  );
}
