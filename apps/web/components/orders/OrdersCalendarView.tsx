'use client';

import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Package, 
  AlertTriangle,
  Clock
} from 'lucide-react';
import { Order, OrderStatus } from '@omnicrm/shared';
import { formatCurrency } from '../../lib/utils';

interface OrdersCalendarViewProps {
  orders: Order[];
  onOrderClick: (order: Order) => void;
  onDateChange: (orderId: string, newDeliveryDate: string) => Promise<void>;
}

export function OrdersCalendarView({
  orders,
  onOrderClick,
  onDateChange
}: OrdersCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const currentMonthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  // Compute calendar grid days
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];

    // Previous month padding
    const prevMonthTotalDays = new Date(year, month, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevMonthTotalDays - i;
      const prevDate = new Date(year, month - 1, d);
      days.push({
        dateStr: prevDate.toISOString().split('T')[0],
        dayNum: d,
        isCurrentMonth: false
      });
    }

    // Current month days
    for (let d = 1; d <= totalDays; d++) {
      const thisDate = new Date(year, month, d);
      days.push({
        dateStr: thisDate.toISOString().split('T')[0],
        dayNum: d,
        isCurrentMonth: true
      });
    }

    // Next month padding to complete 35 or 42 cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(year, month + 1, d);
      days.push({
        dateStr: nextDate.toISOString().split('T')[0],
        dayNum: d,
        isCurrentMonth: false
      });
    }

    return days;
  }, [currentDate]);

  // Group orders by deliveryDate YYYY-MM-DD
  const ordersByDate = useMemo(() => {
    const map = new Map<string, Order[]>();
    for (const order of orders) {
      if (!order.deliveryDate) continue;
      const d = new Date(order.deliveryDate).toISOString().split('T')[0];
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(order);
    }
    return map;
  }, [orders]);

  // Unscheduled orders (without deliveryDate)
  const unscheduledOrders = useMemo(() => {
    return orders.filter(o => !o.deliveryDate && o.status !== OrderStatus.CANCELADO && o.status !== OrderStatus.ENTREGUE);
  }, [orders]);

  const handleDragOver = (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    setDragOverDate(dateStr);
  };

  const handleDragLeave = () => {
    setDragOverDate(null);
  };

  const handleDrop = async (e: React.DragEvent, targetDateStr: string) => {
    e.preventDefault();
    setDragOverDate(null);
    const orderId = e.dataTransfer.getData('orderId');
    if (!orderId) return;

    await onDateChange(orderId, targetDateStr);
  };

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-[#111513] border border-[#222924]">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#57EF40]/10 border border-[#57EF40]/30 text-[#57EF40]">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white capitalize">{currentMonthName}</h3>
            <p className="text-[11px] text-muted-foreground">
              Arraste pedidos entre os dias para reagendar entregas automaticamente
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={prevMonth}
            className="p-2 rounded-xl bg-[#18201C] hover:bg-[#202B25] text-muted-foreground hover:text-white border border-[#222924] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1.5 rounded-xl bg-[#18201C] hover:bg-[#202B25] text-xs font-semibold text-white border border-[#222924] transition-colors"
          >
            Hoje
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="p-2 rounded-xl bg-[#18201C] hover:bg-[#202B25] text-muted-foreground hover:text-white border border-[#222924] transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Unscheduled Orders Drawer / Ribbon if any */}
      {unscheduledOrders.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-[#111513] border border-[#222924] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-amber-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Pedidos Sem Data de Entrega Agendada ({unscheduledOrders.length})
            </span>
            <span className="text-[10px] text-muted-foreground">Arraste para um dia no calendário</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {unscheduledOrders.map(order => (
              <div
                key={order.id}
                draggable
                onDragStart={(e) => e.dataTransfer.setData('orderId', order.id)}
                onClick={() => onOrderClick(order)}
                className="shrink-0 p-2.5 rounded-xl bg-[#0c0f0d] border border-[#222924] hover:border-[#57EF40]/50 cursor-grab active:cursor-grabbing transition-colors text-xs space-y-1 w-48"
              >
                <div className="flex items-center justify-between font-mono font-bold text-[10px]">
                  <span className="text-[#57EF40]">{order.code}</span>
                  <span className="text-white">{formatCurrency(Number(order.totalAmount))}</span>
                </div>
                <p className="font-semibold text-white truncate text-[11px]">
                  {order.lead?.name || 'Cliente'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Calendar Grid */}
      <div className="rounded-2xl border border-[#222924] bg-[#0c0f0d] overflow-hidden shadow-xl">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 border-b border-[#222924] bg-[#111513] text-center text-[11px] font-bold text-muted-foreground uppercase py-2.5">
          <div>Dom</div>
          <div>Seg</div>
          <div>Ter</div>
          <div>Qua</div>
          <div>Qui</div>
          <div>Sex</div>
          <div>Sáb</div>
        </div>

        {/* Days Cells */}
        <div className="grid grid-cols-7 divide-x divide-y divide-[#222924]">
          {calendarDays.map((cell, idx) => {
            const dayOrders = ordersByDate.get(cell.dateStr) || [];
            const isToday = cell.dateStr === new Date().toISOString().split('T')[0];
            const isOver = dragOverDate === cell.dateStr;

            return (
              <div
                key={idx}
                onDragOver={(e) => handleDragOver(e, cell.dateStr)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, cell.dateStr)}
                className={`min-h-[120px] p-2 flex flex-col justify-between transition-colors ${
                  !cell.isCurrentMonth ? 'bg-[#090b0a]/60 text-muted-foreground/40' : 'bg-[#0c0f0d]'
                } ${isOver ? 'bg-[#57EF40]/10 ring-2 ring-inset ring-[#57EF40]' : ''}`}
              >
                {/* Day Number Header */}
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-bold font-mono px-1.5 py-0.5 rounded-md ${
                    isToday ? 'bg-[#57EF40] text-[#070908]' : 'text-gray-400'
                  }`}>
                    {cell.dayNum}
                  </span>
                  {dayOrders.length > 0 && (
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {dayOrders.length} {dayOrders.length === 1 ? 'ped.' : 'peds.'}
                    </span>
                  )}
                </div>

                {/* Orders in this Day */}
                <div className="flex-1 space-y-1 overflow-y-auto max-h-24">
                  {dayOrders.map(order => {
                    const isPast = new Date(cell.dateStr) < new Date() && order.status !== OrderStatus.ENTREGUE;

                    return (
                      <div
                        key={order.id}
                        draggable
                        onDragStart={(e) => {
                          e.stopPropagation();
                          e.dataTransfer.setData('orderId', order.id);
                        }}
                        onClick={() => onOrderClick(order)}
                        className={`p-1.5 rounded-lg border text-[10px] cursor-pointer transition-all hover:scale-[1.02] ${
                          isPast 
                            ? 'bg-amber-500/15 border-amber-500/30 text-amber-300' 
                            : 'bg-[#18201C] border-[#222924] text-white hover:border-[#57EF40]/40'
                        }`}
                      >
                        <div className="flex items-center justify-between font-mono font-bold">
                          <span>{order.code}</span>
                          <span className="text-[#57EF40]">{formatCurrency(Number(order.totalAmount))}</span>
                        </div>
                        <p className="truncate text-[9px] text-muted-foreground">
                          {order.lead?.name || 'Cliente'}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
