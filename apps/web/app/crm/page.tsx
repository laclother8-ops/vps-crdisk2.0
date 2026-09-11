'use client';

import React, { useEffect, useMemo } from 'react';
import { 
  Kanban, 
  Plus, 
  Search, 
  RefreshCw,
  Sparkles,
  DollarSign,
  Users,
  Tag as TagIcon,
  Filter,
  CheckCircle2,
  TrendingUp
} from 'lucide-react';
import { useCRMStore } from '../../stores/useCRMStore';
import { KanbanColumn } from '../../components/crm/KanbanColumn';
import { LeadDrawer } from '../../components/crm/LeadDrawer';
import { CreateDealModal } from '../../components/crm/CreateDealModal';
import { FunnelStage } from '@omnicrm/shared';
import { formatCurrency } from '../../lib/utils';
import { Button } from '../../components/ui/Button';

export default function CRMPage() {
  const { 
    leads, 
    fetchLeads, 
    openCreateDeal, 
    isLoading, 
    searchQuery, 
    setSearchQuery,
    selectedResponsible,
    setSelectedResponsible,
    selectedTag,
    setSelectedTag
  } = useCRMStore();

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Funnel Stages Definition (CRDISK 6 Stages)
  const stages = [
    { key: FunnelStage.NOVO_LEAD, label: 'Novo Lead', color: '#57EF40' },
    { key: FunnelStage.QUALIFICACAO, label: 'Em Qualificação', color: '#65C556' },
    { key: FunnelStage.PROPOSTA, label: 'Proposta Enviada', color: '#57EF40' },
    { key: FunnelStage.FOLLOWUP_ATIVO, label: 'Follow-up Ativo', color: '#38BDF8' },
    { key: FunnelStage.FECHADO_GANHO, label: 'Fechado / Ganho', color: '#57EF40' },
    { key: FunnelStage.PERDIDO, label: 'Perdido', color: '#EF4444' }
  ];

  // Extract unique tags and responsibles for filter dropdowns
  const availableTags = useMemo(() => {
    const set = new Set<string>();
    leads.forEach(l => {
      if (l.tags && Array.isArray(l.tags)) {
        l.tags.forEach(t => set.add(t));
      }
    });
    return Array.from(set);
  }, [leads]);

  const availableResponsibles = useMemo(() => {
    const set = new Set<string>();
    leads.forEach(l => {
      if (l.assignedUserId) set.add(l.assignedUserId);
    });
    return Array.from(set);
  }, [leads]);

  // Filter leads based on search query, responsible, and tag
  const filteredLeads = useMemo(() => {
    return leads.filter(l => {
      const matchesSearch = !searchQuery || (
        l.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (l.company && l.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
        l.phone.includes(searchQuery)
      );

      const matchesResponsible = selectedResponsible === 'all' || l.assignedUserId === selectedResponsible;

      const matchesTag = selectedTag === 'all' || (l.tags && l.tags.includes(selectedTag));

      return matchesSearch && matchesResponsible && matchesTag;
    });
  }, [leads, searchQuery, selectedResponsible, selectedTag]);

  const totalValue = filteredLeads.reduce((sum, lead) => sum + Number(lead.dealValue || 15000), 0);
  const totalWonValue = filteredLeads
    .filter(l => l.funnelStage === FunnelStage.FECHADO_GANHO)
    .reduce((sum, lead) => sum + Number(lead.dealValue || 15000), 0);

  return (
    <div className="space-y-5 h-full flex flex-col max-w-[1700px] mx-auto">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
              <Kanban className="w-5 h-5 text-[#57EF40]" />
              Funil de Vendas
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Arraste os cards para avançar as oportunidades, faça ligações diretas ou abra o WhatsApp em 1-clique.
          </p>
        </div>

        {/* Action Header Stats & Quick Action Button */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-between lg:justify-end">
          
          {/* Quick Metrics */}
          <div className="hidden sm:flex items-center gap-3 px-3.5 py-2 rounded-2xl bg-[#111513] border border-[#222924] text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Leads:</span>
              <strong className="text-foreground font-bold">{filteredLeads.length}</strong>
            </div>
            <span className="text-[#222924]">|</span>
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-[#57EF40]" />
              <span className="text-muted-foreground">Volume Total:</span>
              <strong className="text-foreground font-bold">{formatCurrency(totalValue)}</strong>
            </div>
          </div>

          <button
            onClick={() => fetchLeads()}
            disabled={isLoading}
            className="p-2.5 rounded-2xl bg-[#111513] hover:bg-[#18201C] text-muted-foreground hover:text-white border border-[#222924] transition-colors"
            title="Atualizar dados"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#57EF40]' : ''}`} />
          </button>

          <button
            onClick={openCreateDeal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#57EF40] to-[#65C556] hover:opacity-95 text-[#070908] text-xs font-extrabold shadow-glow-green active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#070908]" />
            <span>+ Novo Lead</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-[#111513] border border-[#222924] shrink-0">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search bar */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome, telefone ou empresa..."
              className="w-full bg-[#18201C] border border-[#222924] focus:border-[#57EF40] rounded-xl pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none transition-all font-medium"
            />
          </div>

          {/* Filter by Tag */}
          <div className="flex items-center gap-1.5 bg-[#18201C] border border-[#222924] rounded-xl px-2.5 py-1.5 text-xs text-muted-foreground">
            <TagIcon className="w-3 h-3 text-muted-foreground" />
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="bg-transparent text-xs text-foreground outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#111513]">Todas as Tags</option>
              {availableTags.map((tag) => (
                <option key={tag} value={tag} className="bg-[#111513]">{tag}</option>
              ))}
            </select>
          </div>

          {/* Filter by Responsible */}
          {availableResponsibles.length > 0 && (
            <div className="flex items-center gap-1.5 bg-[#18201C] border border-[#222924] rounded-xl px-2.5 py-1.5 text-xs text-muted-foreground">
              <Users className="w-3 h-3 text-muted-foreground" />
              <select
                value={selectedResponsible}
                onChange={(e) => setSelectedResponsible(e.target.value)}
                className="bg-transparent text-xs text-foreground outline-none cursor-pointer"
              >
                <option value="all" className="bg-[#111513]">Todos os Responsáveis</option>
                {availableResponsibles.map((resp) => (
                  <option key={resp} value={resp} className="bg-[#111513]">{resp}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Active Filter Clear Button */}
        {(searchQuery || selectedTag !== 'all' || selectedResponsible !== 'all') && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedTag('all');
              setSelectedResponsible('all');
            }}
            className="text-[11px] font-bold text-[#57EF40] hover:underline px-2 py-1"
          >
            Limpar Filtros
          </button>
        )}
      </div>

      {/* Kanban Board Horizontal Scroll */}
      <div className="flex-1 overflow-x-auto pb-4 scrollbar-thin">
        {isLoading && leads.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground gap-3">
            <RefreshCw className="w-5 h-5 animate-spin text-primary" />
            <span className="text-xs font-mono">Carregando oportunidades do funil CRDISK...</span>
          </div>
        ) : (
          <div className="flex items-start gap-4 min-w-max pb-2">
            {stages.map((stage) => {
              const stageLeads = filteredLeads.filter(l => {
                const leadStage = (l.funnelStage || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
                const currentStage = stage.key.toUpperCase().replace(/[^A-Z0-9]/g, '');
                
                if (leadStage === currentStage) return true;
                if (currentStage === 'NOVOLEAD' && (leadStage === 'NOVO' || leadStage === 'NOVOSLEADS' || leadStage === 'NOVOLEAD')) return true;
                if (currentStage === 'QUALIFICACAO' && (leadStage === 'EMQUALIFICACAO' || leadStage === 'QUALIFICACAO' || leadStage === 'APRESENTACAO')) return true;
                if (currentStage === 'PROPOSTA' && (leadStage === 'PROPOSTA' || leadStage === 'PROPOSTACOMERCIAL' || leadStage === 'PROPOSTAENVIADA')) return true;
                if (currentStage === 'FOLLOWUPATIVO' && (leadStage === 'FOLLOWUP' || leadStage === 'FOLLOWUPATIVO')) return true;
                if (currentStage === 'FECHADOGANHO' && (leadStage === 'FECHADO' || leadStage === 'GANHO' || leadStage === 'FECHADOGANHO')) return true;
                if (currentStage === 'PERDIDO' && leadStage === 'PERDIDO') return true;

                return false;
              });

              return (
                <KanbanColumn
                  key={stage.key}
                  stageKey={stage.key}
                  stageName={stage.label}
                  colorHex={stage.color}
                  leads={stageLeads}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Lead Details Slide-over Sheet */}
      <LeadDrawer />

      {/* Create Deal Modal */}
      <CreateDealModal />
    </div>
  );
}
