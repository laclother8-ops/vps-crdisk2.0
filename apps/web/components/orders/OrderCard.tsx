'use client';

import React from 'react';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  Phone, 
  Package, 
  RefreshCw, 
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Order, OrderStatus } from '@omnicrm/shared';
import { formatCurrency, formatPhone } from '../../lib/utils';
import { useSoftphoneStore } from '../../stores/useSoftphoneStore';

const STEP_ORDER: OrderStatus[] = [
  OrderStatus.ORCAMENTO,
  OrderStatus.APROVADO,
  OrderStatus.EM_SEPARACAO,
  OrderStatus.PRODUCAO,
  OrderStatus.FATURADO,
  OrderStatus.EM_ROTA,
  OrderStatus.ENTREGUE
];

interface OrderCardProps {
  order: Order;
  onOpenDetails: (order: Order) => void;
  onStatusChange: (orderId: string, newStatus: OrderStatus) => Promise<void>;
  onSyncContaAzul?: (orderId: string) => Promise<void>;
}

export function OrderCard({
  order,
  onOpenDetails,
  onStatusChange,
  onSyncContaAzul
}: OrderCardProps) {
  const { startCall } = useSoftphoneStore();
  const [isUpdating, setIsUpdating] = React.useState(false);

  const currentIndex = STEP_ORDER.indexOf(order.status);
  const canGoBack = currentIndex > 0;
  const canGoForward = currentIndex >= 0 && currentIndex < STEP_ORDER.length - 1;

  // Check delivery delay
  const isDelayed = React.useMemo(() => {
    if (!order.deliveryDate) return false;
    if (order.status === OrderStatus.ENTREGUE || order.status === OrderStatus.CANCELADO) return false;
    return new Date(order.deliveryDate) < new Date();
  }, [order.deliveryDate, order.status]);

  const handleStep = async (e: React.MouseEvent, direction: 'back' | 'forward') => {
    e.stopPropagation();
    if (isUpdating) return;

    const nextIndex = direction === 'forward' ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex < 0 || nextIndex >= STEP_ORDER.length) return;

    const targetStatus = STEP_ORDER[nextIndex];
    try {
      setIsUpdating(true);
      await onStatusChange(order.id, targetStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (order.lead?.phone) {
      startCall(order.lead as any);
    }
  };

  const handleSyncContaAzul = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSyncContaAzul) {
      setIsUpdating(true);
      try {
        await onSyncContaAzul(order.id);
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const itemsCount = order.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('orderId', order.id);
        e.dataTransfer.setData('currentStatus', order.status);
      }}
      onClick={() => onOpenDetails(order)}
      className={`p-4 rounded-2xl bg-[#111513] border transition-all duration-150 cursor-pointer space-y-3 group relative overflow-hidden shadow-sm select-none ${
        isDelayed 
          ? 'border-amber-500/50 hover:border-amber-500/80 bg-[#161410]' 
          : 'border-[#222924] hover:border-[#38463e] hover:bg-[#141815]'
      }`}
    >
      {/* Delayed alert banner if past due date */}
      {isDelayed && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold">
          <AlertTriangle className="w-3 h-3 shrink-0" />
          <span>Prazo de Entrega Excedido</span>
        </div>
      )}

      {/* Header: Code, Relative Time, Total */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-mono font-bold text-xs text-[#57EF40]">
              {order.code}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {new Date(order.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
            </span>
          </div>
          <h4 className="font-bold text-xs text-white group-hover:text-[#57EF40] transition-colors truncate max-w-[150px] mt-0.5">
            {order.lead?.name || 'Cliente Sem Nome'}
          </h4>
          {order.lead?.company && (
            <p className="text-[10px] text-muted-foreground truncate">
              {order.lead.company}
            </p>
          )}
        </div>

        <div className="text-right shrink-0">
          <span className="font-mono font-bold text-xs text-white bg-[#18201C] px-2.5 py-1 rounded-lg border border-[#222924] inline-block">
            {formatCurrency(Number(order.totalAmount))}
          </span>
          <p className="text-[9px] text-muted-foreground mt-1 flex items-center justify-end gap-1">
            <Package className="w-2.5 h-2.5" />
            {itemsCount} {itemsCount === 1 ? 'item' : 'itens'}
          </p>
        </div>
      </div>

      {/* Badges: Conta Azul Sync Status + Delivery Date */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        {/* Conta Azul Badge */}
        {order.contaAzulSyncStatus === 'SYNCED' ? (
          <span className="text-[9px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle2 className="w-2.5 h-2.5" />
            Conta Azul
          </span>
        ) : order.contaAzulSyncStatus === 'FAILED' ? (
          <button
            type="button"
            onClick={handleSyncContaAzul}
            className="text-[9px] font-semibold px-2 py-0.5 rounded-md bg-red-500/10 text-red-400 border border-red-500/30 flex items-center gap-1 hover:bg-red-500/20 transition-colors"
            title="Clique para tentar sincronizar novamente"
          >
            <AlertCircle className="w-2.5 h-2.5" />
            Falha CA (Reenviar)
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSyncContaAzul}
            className="text-[9px] font-semibold px-2 py-0.5 rounded-md bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 flex items-center gap-1 hover:bg-yellow-500/20 transition-colors"
            title="Clique para sincronizar com Conta Azul"
          >
            <RefreshCw className="w-2.5 h-2.5" />
            CA Pendente
          </button>
        )}

        {/* Delivery Date Badge */}
        {order.deliveryDate && (
          <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
            isDelayed 
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
              : 'bg-[#18201C] text-muted-foreground border-[#222924]'
          }`}>
            <Calendar className="w-2.5 h-2.5" />
            {new Date(order.deliveryDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
          </span>
        )}
      </div>

      {/* Footer: Quick Stage Step Actions (Voltar / Avançar) + Softphone Call */}
      <div className="pt-2.5 border-t border-[#222924] flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1">
          {canGoBack && (
            <button
              type="button"
              disabled={isUpdating}
              onClick={(e) => handleStep(e, 'back')}
              className="px-2 py-1 rounded-md bg-[#18201C] hover:bg-[#202B25] text-muted-foreground hover:text-white border border-[#222924] text-[10px] font-semibold flex items-center gap-0.5 transition-all disabled:opacity-50"
              title="Voltar etapa anterior"
            >
              <ChevronLeft className="w-3 h-3" />
              <span>Voltar</span>
            </button>
          )}

          {canGoForward && (
            <button
              type="button"
              disabled={isUpdating}
              onClick={(e) => handleStep(e, 'forward')}
              className="px-2 py-1 rounded-md bg-[#57EF40]/10 hover:bg-[#57EF40]/20 text-[#57EF40] border border-[#57EF40]/30 text-[10px] font-bold flex items-center gap-0.5 transition-all disabled:opacity-50"
              title="Avançar para próxima etapa"
            >
              <span>Avançar</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Direct Call to Lead */}
        {order.lead?.phone && (
          <button
            type="button"
            onClick={handleCall}
            className="p-1.5 rounded-md bg-[#18201C] hover:bg-[#202B25] text-muted-foreground hover:text-[#57EF40] border border-[#222924] transition-all"
            title={`Ligar para ${formatPhone(order.lead.phone)}`}
          >
            <Phone className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}
