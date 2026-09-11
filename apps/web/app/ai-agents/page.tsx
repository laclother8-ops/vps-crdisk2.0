'use client';

import React, { useEffect, useState } from 'react';
import { 
  Bot, 
  Sparkles, 
  Database, 
  Wrench, 
  Save, 
  Sliders,
  FileText
} from 'lucide-react';
import { api } from '../../lib/api';
import { PromptPlayground } from '../../components/ai/PromptPlayground';
import { DocumentUploader } from '../../components/ai/DocumentUploader';
import { FollowupQueueTable } from '../../components/ai/FollowupQueueTable';
import { Button } from '../../components/ui/Button';

export default function AIAgentsPage() {
  const [agent, setAgent] = useState<any>(null);
  const [knowledgeBase, setKnowledgeBase] = useState<any[]>([]);
  const [followupQueue, setFollowupQueue] = useState<any[]>([]);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  const [model, setModel] = useState('gpt-4o');
  const [autoReply, setAutoReply] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  const loadData = async () => {
    try {
      const [ag, kb, queue] = await Promise.all([
        api.getAgent(),
        api.getKnowledgeBase(),
        api.getFollowupQueue()
      ]);
      setAgent(ag);
      setSystemPrompt(ag.systemPrompt);
      setTemperature(ag.temperature);
      setModel(ag.model);
      setAutoReply(ag.autoReplyWhatsApp);
      setKnowledgeBase(kb);
      setFollowupQueue(queue);
    } catch (err) {
      console.error('Failed to load AI Studio data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveConfig = async () => {
    try {
      await api.updateAgent({
        systemPrompt,
        temperature,
        model,
        autoReplyWhatsApp: autoReply
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save agent config:', err);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
              <Bot className="w-5 h-5 text-[#57EF40]" />
              Assistente Virtual de Vendas
            </h1>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#18201C] text-[#57EF40] border border-[#222924]">
              Sofia (Atendente Virtual)
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure as respostas automáticas, manuais de produtos e ações executadas pela assistente no atendimento.
          </p>
        </div>

        <button
          onClick={handleSaveConfig}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#57EF40] to-[#65C556] hover:opacity-95 text-[#070908] text-xs font-extrabold shadow-glow-green active:scale-95 transition-all cursor-pointer"
        >
          <Save className="w-4 h-4 text-[#070908]" />
          <span>{isSaved ? 'Configurações Salvas!' : 'Salvar Alterações'}</span>
        </button>
      </div>

      {/* Main Grid: Prompt & Config (Left) vs RAG & Tools (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Prompt Engineering & Model Settings */}
        <div className="space-y-6">
          {/* Agent Settings Card */}
          <div className="p-6 rounded-3xl bg-[#111513] border border-[#222924] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs text-foreground uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#57EF40]" />
                Comportamento e Respostas
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Respostas Automáticas no WhatsApp:</span>
                <input
                  type="checkbox"
                  checked={autoReply}
                  onChange={(e) => setAutoReply(e.target.checked)}
                  className="w-4 h-4 accent-[#57EF40] rounded cursor-pointer"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Modelo de Inteligência</label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-[#18201C] border border-[#222924] focus:border-[#57EF40] rounded-xl px-3 py-2 text-xs text-foreground outline-none"
                >
                  <option value="gpt-4o">OpenAI GPT-4o (Recomendado)</option>
                  <option value="gpt-4o-mini">OpenAI GPT-4o Mini (Rápido)</option>
                  <option value="claude-3-5-sonnet-20241022">Anthropic Claude 3.5 Sonnet</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Nível de Criatividade: <strong className="text-foreground font-mono">{temperature}</strong>
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full accent-[#57EF40] mt-2"
                />
              </div>
            </div>

            {/* System Prompt Textarea */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Instruções de Atendimento e Persona da Sofia
              </label>
              <textarea
                rows={7}
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="w-full bg-[#18201C] border border-[#222924] focus:border-[#57EF40] rounded-2xl p-3.5 text-xs text-foreground leading-relaxed outline-none resize-none transition-all font-sans"
              />
            </div>
          </div>

          {/* Realtime Testing Playground */}
          <PromptPlayground />
        </div>

        {/* Right Column: Knowledge Base & Tools */}
        <div className="space-y-6">
          {/* Document Ingestion */}
          <div className="p-6 rounded-3xl bg-[#111513] border border-[#222924] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs text-foreground uppercase tracking-wider flex items-center gap-2">
                <Database className="w-4 h-4 text-[#57EF40]" />
                Base de Conhecimento e Treinamento
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#18201C] border border-[#222924] text-muted-foreground">
                {knowledgeBase.length} Documentos
              </span>
            </div>

            {/* Ingestion Form */}
            <DocumentUploader onUploaded={loadData} />

            {/* Documents List */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Documentos e Manuais Cadastrados
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {knowledgeBase.map((doc: any) => (
                  <div key={doc.id} className="p-3.5 rounded-2xl bg-[#18201C] border border-[#222924] flex items-center justify-between text-xs hover:border-[#333E37] transition-all">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <h5 className="font-bold text-foreground truncate">{doc.title}</h5>
                        <p className="text-[10px] text-muted-foreground">Categoria: {doc.category}</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-semibold text-[#57EF40] bg-[#111513] px-2 py-0.5 rounded-full border border-[#222924] shrink-0">
                      Ativo
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tools Registry Section */}
          <div className="p-6 rounded-3xl bg-[#111513] border border-[#222924] space-y-4">
            <h3 className="font-bold text-xs text-foreground uppercase tracking-wider flex items-center gap-2">
              <Wrench className="w-4 h-4 text-[#57EF40]" />
              Ações Automáticas da Assistente
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="p-3.5 rounded-2xl bg-[#18201C] border border-[#222924] space-y-1 hover:border-[#333E37] transition-all">
                <div className="flex items-center justify-between font-bold text-foreground">
                  <span>Agendamento de Reuniões</span>
                  <span className="text-[10px] font-semibold text-[#57EF40] bg-[#111513] px-2 py-0.5 rounded-full border border-[#222924]">Ativa</span>
                </div>
                <p className="text-muted-foreground text-[11px]">
                  Verifica horários disponíveis e confirma compromissos na agenda comercial.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#18201C] border border-[#222924] space-y-1 hover:border-[#333E37] transition-all">
                <div className="flex items-center justify-between font-bold text-foreground">
                  <span>Atualização de Oportunidades</span>
                  <span className="text-[10px] font-semibold text-[#57EF40] bg-[#111513] px-2 py-0.5 rounded-full border border-[#222924]">Ativa</span>
                </div>
                <p className="text-muted-foreground text-[11px]">
                  Avança o lead no funil de vendas e atualiza o valor da proposta automaticamente.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#18201C] border border-[#222924] space-y-1 hover:border-[#333E37] transition-all">
                <div className="flex items-center justify-between font-bold text-foreground">
                  <span>Transferência para Ligação Imediata</span>
                  <span className="text-[10px] font-semibold text-[#57EF40] bg-[#111513] px-2 py-0.5 rounded-full border border-[#222924]">Ativa</span>
                </div>
                <p className="text-muted-foreground text-[11px]">
                  Posiciona o contato no topo da central de ligações quando solicitado atendimento humano.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Follow-up Queue & Automation Engine */}
      <FollowupQueueTable />
    </div>
  );
}
