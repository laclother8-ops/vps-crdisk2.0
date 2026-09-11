'use client';

import React, { useState } from 'react';
import { 
  Users, 
  ArrowRight, 
  X, 
  Sparkles, 
  UserCheck, 
  Headphones, 
  CreditCard 
} from 'lucide-react';
import { useChatStore } from '../../stores/useChatStore';

const OPERATORS = [
  { id: 'usr-1', name: 'Lucas Santos', role: 'Closer Sênior', dept: 'Comercial' },
  { id: 'usr-2', name: 'Amanda Lima', role: 'SDR Líder', dept: 'Qualificação' },
  { id: 'usr-3', name: 'Rodrigo Silva', role: 'Suporte N2', dept: 'Suporte' },
  { id: 'usr-sofia', name: 'Sofia IA', role: 'Agente Autônoma', dept: 'IA Sofia' }
];

const DEPARTMENTS = [
  { id: 'Comercial', label: 'Comercial / Vendas', icon: UserCheck },
  { id: 'Suporte', label: 'Suporte Técnico', icon: Headphones },
  { id: 'Financeiro', label: 'Financeiro / Contratos', icon: CreditCard },
  { id: 'IA Sofia', label: 'Agente Autônoma Sofia IA', icon: Sparkles }
];

export function TransferModal() {
  const { isTransferModalOpen, setIsTransferModalOpen, selectedLeadId, conversations, transferConversation } = useChatStore();
  const [selectedUser, setSelectedUser] = useState(OPERATORS[0].name);
  const [selectedDept, setSelectedDept] = useState(DEPARTMENTS[0].id);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isTransferModalOpen || !selectedLeadId) return null;

  const currentConv = conversations.find(c => c.leadId === selectedLeadId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await transferConversation(selectedLeadId, selectedUser, selectedDept, notes);
      setNotes('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#111513] border border-[#26332B] shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#26332B] bg-[#18201C]/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shadow-glow-green-sm">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-foreground tracking-tight">
                Transferir Atendimento
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Lead: <strong className="text-foreground">{currentConv?.lead?.name || 'Cliente'}</strong> ({currentConv?.lead?.phone})
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsTransferModalOpen(false)}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-[#18201C] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Department Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground">
              Departamento de Destino
            </label>
            <div className="grid grid-cols-2 gap-2">
              {DEPARTMENTS.map(dept => {
                const Icon = dept.icon;
                const isSelected = selectedDept === dept.id;
                return (
                  <button
                    key={dept.id}
                    type="button"
                    onClick={() => {
                      setSelectedDept(dept.id);
                      if (dept.id === 'IA Sofia') setSelectedUser('Sofia IA');
                    }}
                    className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all text-xs font-bold ${
                      isSelected
                        ? 'bg-primary/15 border-primary text-primary shadow-glow-green-sm'
                        : 'bg-[#18201C] border-[#26332B] text-muted-foreground hover:text-foreground hover:border-[#26332B]/80'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{dept.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Operator Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground">
              Atendente / Responsável
            </label>
            <div className="grid grid-cols-2 gap-2">
              {OPERATORS.map(op => {
                const isSelected = selectedUser === op.name;
                return (
                  <button
                    key={op.id}
                    type="button"
                    onClick={() => {
                      setSelectedUser(op.name);
                      setSelectedDept(op.dept);
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'bg-primary/15 border-primary text-primary shadow-glow-green-sm'
                        : 'bg-[#18201C] border-[#26332B] text-foreground hover:border-primary/40'
                    }`}
                  >
                    <div className="font-bold text-xs truncate flex items-center gap-1.5">
                      {op.id === 'usr-sofia' && <Sparkles className="w-3 h-3 text-primary animate-pulse" />}
                      {op.name}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {op.role} ({op.dept})
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Transfer Notes */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground">
              Notas Internas de Transbordo (Opcional)
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Cliente tem interesse no plano Enterprise com 50 ramais e pediu para falar com o especialista comercial..."
              className="w-full bg-background border border-[#26332B] focus:border-primary rounded-2xl p-3 text-xs text-foreground placeholder:text-muted-foreground outline-none transition-all focus:shadow-glow-green-sm resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsTransferModalOpen(false)}
              className="px-5 py-2.5 rounded-2xl border border-[#26332B] text-muted-foreground hover:text-foreground text-xs font-bold transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#57EF40] to-[#65C556] text-[#070908] font-extrabold text-xs shadow-glow-green flex items-center gap-2 hover:opacity-95 transition-all disabled:opacity-50"
            >
              <ArrowRight className="w-4 h-4" />
              <span>{isSubmitting ? 'Transferindo...' : 'Confirmar Transferência'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
