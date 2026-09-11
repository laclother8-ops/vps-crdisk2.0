'use client';

import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { useCRMStore } from '../../stores/useCRMStore';
import { FunnelStage, LeadContactStatus } from '@omnicrm/shared';
import { Button } from '../ui/Button';

export function CreateDealModal() {
  const { isCreateDealOpen, closeCreateDeal, createLead } = useCRMStore();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [dealValue, setDealValue] = useState(15000);
  const [funnelStage, setFunnelStage] = useState<FunnelStage>(FunnelStage.NOVO_LEAD);
  const [tagsInput, setTagsInput] = useState('Inbound, WhatsApp');

  if (!isCreateDealOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    await createLead({
      name,
      phone,
      email: email || null,
      company: company || null,
      dealValue: Number(dealValue),
      funnelStage,
      status: LeadContactStatus.NAO_CONTATADO,
      tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean)
    });

    setName('');
    setPhone('');
    setEmail('');
    setCompany('');
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl glass-elevated border border-border p-6 space-y-5 shadow-glass-crdisk animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <h3 className="font-extrabold text-base text-foreground flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            Novo Lead no CRDISK
          </h3>
          <button onClick={closeCreateDeal} className="text-muted-foreground hover:text-foreground p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">Nome do Contato *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Mariana Souza"
              className="w-full bg-surface border border-border focus:border-primary rounded-xl px-3.5 py-2.5 text-xs text-foreground outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">Telefone (WhatsApp) *</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+55 (11) 98765-4321"
                className="w-full bg-surface border border-border focus:border-primary rounded-xl px-3.5 py-2.5 text-xs text-foreground font-mono outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">Empresa</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="TechCorp Brasil"
                className="w-full bg-surface border border-border focus:border-primary rounded-xl px-3.5 py-2.5 text-xs text-foreground outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">Valor Estimado (R$)</label>
              <input
                type="number"
                min="0"
                step="500"
                value={dealValue}
                onChange={(e) => setDealValue(Number(e.target.value))}
                className="w-full bg-surface border border-border focus:border-primary rounded-xl px-3.5 py-2.5 text-xs text-foreground font-mono outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">Etapa Inicial</label>
              <select
                value={funnelStage}
                onChange={(e) => setFunnelStage(e.target.value as FunnelStage)}
                className="w-full bg-surface border border-border focus:border-primary rounded-xl px-3.5 py-2.5 text-xs text-foreground outline-none"
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

          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">Tags (separadas por vírgula)</label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="Enterprise, WhatsApp, Demo"
              className="w-full bg-surface border border-border focus:border-primary rounded-xl px-3.5 py-2.5 text-xs text-foreground outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <button
              type="button"
              onClick={closeCreateDeal}
              className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#57EF40] to-[#3CD427] text-[#070908] text-xs font-black shadow-[0_0_20px_rgba(87,239,64,0.35)] hover:shadow-[0_0_28px_rgba(87,239,64,0.5)] hover:brightness-110 active:scale-95 transition-all"
            >
              Cadastrar Lead
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
