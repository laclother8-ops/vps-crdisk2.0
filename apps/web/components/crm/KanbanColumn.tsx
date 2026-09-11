'use client';

import React, { useState } from 'react';
import { FunnelStage, Lead } from '@omnicrm/shared';
import { DealCard } from './DealCard';
import { formatCurrency } from '../../lib/utils';
import { Plus } from 'lucide-react';
import { useCRMStore } from '../../stores/useCRMStore';

interface KanbanColumnProps {
  stageKey: FunnelStage;
  stageName: string;
  colorHex?: string;
  leads: Lead[];
}

export function KanbanColumn({ stageKey, stageName, colorHex = '#57EF40', leads }: KanbanColumnProps) {
  const { moveDeal, openCreateDeal } = useCRMStore();
  const [isDragOver, setIsDragOver] = useState(false);

  const totalValue = leads.reduce((acc, curr) => acc + Number(curr.dealValue || 15000), 0);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const leadId = e.dataTransfer.getData('text/plain');
    if (leadId) {
      moveDeal(leadId, stageKey as any);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`w-80 shrink-0 flex flex-col rounded-3xl p-4 space-y-3.5 min-h-[560px] transition-all duration-200 border ${
        isDragOver
          ? 'border-[#57EF40]/60 bg-[#57EF40]/[0.03] ring-1 ring-[#57EF40]/20'
          : 'border-[#222924] bg-[#0e1210]/90 hover:border-[#2d3731]'
      }`}
    >
      {/* Stage Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: colorHex }}
          />
          <h3 className="font-extrabold text-xs text-foreground tracking-tight">{stageName}</h3>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#18201C] border border-[#222924] text-muted-foreground">
            {leads.length}
          </span>
        </div>

        <button
          onClick={openCreateDeal}
          className="text-muted-foreground hover:text-white p-1 rounded-lg hover:bg-[#18201C] border border-transparent hover:border-[#222924] transition-all"
          title="Novo Lead nesta etapa"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Stage Total Sum */}
      <div className="px-1 text-[11px] font-mono text-muted-foreground flex items-center justify-between border-b border-[#222924] pb-2.5">
        <span className="text-muted-foreground/70">Total da Etapa:</span>
        <span className="font-bold text-foreground font-mono">{formatCurrency(totalValue)}</span>
      </div>

      {/* Leads Cards Container */}
      <div className="space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-270px)] pr-1 scrollbar-thin">
        {leads.length > 0 ? (
          leads.map((lead) => (
            <div
              key={lead.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', lead.id);
              }}
              className="cursor-grab active:cursor-grabbing"
            >
              <DealCard lead={lead} />
            </div>
          ))
        ) : (
          <div
            className={`py-14 text-center border border-dashed rounded-2xl transition-colors ${
              isDragOver ? 'border-[#57EF40]/50 bg-[#57EF40]/5 text-[#57EF40]' : 'border-[#222924] text-muted-foreground/40'
            }`}
          >
            <p className="text-xs font-medium">
              {isDragOver ? 'Solte para mover aqui' : 'Nenhum lead nesta etapa'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
