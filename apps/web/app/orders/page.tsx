'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  ShoppingCart, 
  Calendar as CalendarIcon, 
  Kanban as KanbanIcon, 
  Search, 
  Plus, 
  RefreshCw, 
  Filter, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  DollarSign
} from 'lucide-react';
import { Order, OrderStatus } from '@omnicrm/shared';
import { api } from '../../lib/api';
import { formatCurrency } from '../../lib/utils';
import { OrderCard } from '../../components/orders/OrderCard';
import { FastOrderModal } from '../../components/orders/FastOrderModal';
import { OrderDetailsModal } from '../../components/orders/OrderDetailsModal';
import { OrdersCalendarView } from '../../components/orders/OrdersCalendarView';

interface ColumnConfig {
  id: OrderStatus;
  title: string;
  color: string;
  bgBadge: string;
  borderBadge: string;
}

const KANBAN_COLUMNS: ColumnConfig[] = [
  { 
    id: OrderStatus.ORCAMENTO, 
    title: 'Orçamento', 
    color: 'text-gray-300', 
    bgBadge: 'bg-gray-500/10', 
    borderBadge: 'border-gray-500/20' 
  },
  { 
    id: OrderStatus.APROVADO, 
    title: 'Aprovado', 
    color: 'text-blue-400', 
    bgBadge: 'bg-blue-500/10', 
    borderBadge: 'border-blue-500/20' 
  },
  { 
    id: OrderStatus.EM_SEPARACAO, 
    title: 'Em Separação', 
    color: 'text-purple-400', 
    bgBadge: 'bg-purple-500/10', 
    borderBadge: 'border-purple-500/20' 
  },
  { 
    id: OrderStatus.PRODUCAO, 
    title: 'Produção', 
    color: 'text-amber-400', 
    bgBadge: 'bg-amber-500/10', 
    borderBadge: 'border-amber-500/20' 
  },
  { 
    id: OrderStatus.FATURADO, 
    title: 'Faturado', 
    color: 'text-teal-400', 
    bgBadge: 'bg-teal-500/10', 
    borderBadge: 'border-teal-500/20' 
  },
  { 
    id: OrderStatus.EM_ROTA, 
    title: 'Em Rota', 
    color: 'text-sky-400', 
    bgBadge: 'bg-sky-500/10', 
    borderBadge: 'border-sky-500/20' 
  },
  { 
    id: OrderStatus.ENTREGUE, 
    title: 'Entregue', 
    color: 'text-[#57EF40]', 
    bgBadge: 'bg-[#57EF40]/10', 
    borderBadge: 'border-[#57EF40]/30' 
  },
  { 
    id: OrderStatus.CANCELADO, 
    title: 'Cancelado', 
    color: 'text-red-400', 
    bgBadge: 'bg-red-500/10', 
    borderBadge: 'border-red-500/20' 
  },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'kanban' | 'calendar'>('kanban');

  // Role & Scope State
  const [userRole, setUserRole] = useState<string>('superadmin');
  const [userId, setUserId] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [scopeFilter, setScopeFilter] = useState<'all' | 'mine'>('all');

  // Modals
  const [isFastOrderOpen, setIsFastOrderOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Drag over column state
  const [dragOverColumn, setDragOverColumn] = useState<OrderStatus | null>(null);

  // Load orders
  const loadOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await api.getOrders();
      setOrders(data || []);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('crdisk_user_role') || 'superadmin';
      const uid = localStorage.getItem('crdisk_user_id') || '';
      const uname = localStorage.getItem('crdisk_user_name') || '';
      setUserRole(role);
      setUserId(uid);
      setUserName(uname);

      // SALES_REP default to "Apenas Meus"
      if (role === 'SALES_REP' || role === 'operator') {
        setScopeFilter('mine');
      }
    }
    loadOrders();
  }, [loadOrders]);

  const isOwnerOrAdmin = userRole === 'OWNER' || userRole === 'ADMIN' || userRole === 'superadmin' || userRole === 'adm' || userRole === 'admin';

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const match = (
          (o.code || o.orderNumber || '').toLowerCase().includes(q) ||
          (o.lead?.name || o.contactName || '').toLowerCase().includes(q) ||
          (o.lead?.company || o.contactCompany || '').toLowerCase().includes(q)
        );
        if (!match) return false;
      }

      if (scopeFilter === 'mine') {
        const leadAssigned = (o.lead as any)?.assignedUserId;
        const isMine = (
          (userId && ((o as any).assignedToId === userId || leadAssigned === userId || (o as any).assignedTo?.id === userId)) ||
          (userName && (o as any).assignedTo?.name?.toLowerCase() === userName.toLowerCase()) ||
          (!userId && !(o as any).assignedToId && !leadAssigned)
        );
        if (!isMine) return false;
      }

      return true;
    });
  }, [orders, searchTerm, scopeFilter, userId, userName]);

  // Total Pipeline Financial Metrics
  const pipelineMetrics = useMemo(() => {
    const activeOrders = filteredOrders.filter(o => o.status !== OrderStatus.CANCELADO);
    const totalRevenue = activeOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    const delayedCount = activeOrders.filter(o => 
      o.deliveryDate && 
      o.status !== OrderStatus.ENTREGUE && 
      new Date(o.deliveryDate) < new Date()
    ).length;

    return {
      totalCount: activeOrders.length,
      totalRevenue,
      delayedCount
    };
  }, [filteredOrders]);

  // Handlers
  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      // Optimistic update
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      await api.updateOrderStatus(orderId, newStatus);
      loadOrders();
    } catch (err: any) {
      console.error('Failed to change status:', err);
      loadOrders();
    }
  };

  const handleDeliveryDateChange = async (orderId: string, newDeliveryDate: string) => {
    try {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, deliveryDate: newDeliveryDate } : o));
      await api.updateOrderDeliveryDate(orderId, newDeliveryDate);
      loadOrders();
    } catch (err: any) {
      console.error('Failed to update delivery date:', err);
      loadOrders();
    }
  };

  const handleSyncContaAzul = async (orderId: string) => {
    try {
      await api.syncContaAzulOrder(orderId);
      loadOrders();
    } catch (err: any) {
      alert(`Falha ao sincronizar com Conta Azul: ${err.message}`);
    }
  };

  const handleOpenDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
  };

  // Drag & drop between columns
  const handleDragOverColumn = (e: React.DragEvent, colId: OrderStatus) => {
    e.preventDefault();
    setDragOverColumn(colId);
  };

  const handleDragLeaveColumn = () => {
    setDragOverColumn(null);
  };

  const handleDropColumn = async (e: React.DragEvent, targetStatus: OrderStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    const orderId = e.dataTransfer.getData('orderId');
    const currentStatus = e.dataTransfer.getData('currentStatus');

    if (!orderId || currentStatus === targetStatus) return;
    await handleStatusChange(orderId, targetStatus);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-[#070908] p-6 space-y-5 overflow-hidden">
      {/* Top Header & Quick Metrics */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              Esteira de Pedidos de Venda
            </h1>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-[#18201C] text-[#57EF40] border border-[#222924]">
              8 Etapas
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Gerenciamento comercial, expedição e integração em tempo real com Conta Azul
          </p>
        </div>

        {/* View Switch & PDV Action */}
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-[#111513] border border-[#222924]">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'kanban'
                  ? 'bg-[#18201C] text-white font-bold border border-[#222924] shadow-sm'
                  : 'text-muted-foreground hover:text-white'
              }`}
            >
              <KanbanIcon className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'calendar'
                  ? 'bg-[#18201C] text-white font-bold border border-[#222924] shadow-sm'
                  : 'text-muted-foreground hover:text-white'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Calendário</span>
            </button>
          </div>

          {/* New Order Button (PDV) */}
          <button
            type="button"
            onClick={() => setIsFastOrderOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#57EF40] hover:bg-[#65C556] text-[#070908] font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-[#57EF40]/10 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Pedido (PDV)</span>
          </button>
        </div>
      </div>

      {/* Filter Bar & Pipeline Financial Highlights */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 p-3.5 rounded-2xl bg-[#111513] border border-[#222924] shrink-0">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Filtrar por código, cliente ou empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#0c0f0d] border border-[#222924] text-xs text-white placeholder:text-muted-foreground focus:outline-none focus:border-[#57EF40] transition-colors"
            />
          </div>

          {/* Scope Segmented Filter: [ Todos | Apenas Meus ] */}
          <div className="flex items-center gap-1.5 bg-[#0c0f0d] border border-[#222924] rounded-xl p-1 text-xs">
            <span className="text-gray-400 text-[11px] font-medium pl-1.5 flex items-center gap-1">
              <Filter className="w-3 h-3 text-[#57EF40]" />
              Responsável:
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setScopeFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  scopeFilter === 'all'
                    ? 'bg-[#57EF40] text-[#070908] shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setScopeFilter('mine')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  scopeFilter === 'mine'
                    ? 'bg-[#57EF40] text-[#070908] shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Apenas Meus
              </button>
            </div>
          </div>
        </div>

        {/* Financial Highlights */}
        <div className="flex items-center gap-6 text-xs font-mono">
          {(isOwnerOrAdmin || scopeFilter === 'mine') && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-[11px]">{scopeFilter === 'mine' ? 'Minha Carteira:' : 'Volume em Carteira:'}</span>
              <strong className="text-white font-bold">{formatCurrency(pipelineMetrics.totalRevenue)}</strong>
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-[11px]">Pedidos Ativos:</span>
            <strong className="text-[#57EF40] font-bold">{pipelineMetrics.totalCount}</strong>
          </div>

          {pipelineMetrics.delayedCount > 0 && (
            <div className="flex items-center gap-1.5 text-amber-400 font-bold">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{pipelineMetrics.delayedCount} atrasados</span>
            </div>
          )}

          <button
            type="button"
            onClick={loadOrders}
            className="p-1.5 rounded-lg bg-[#18201C] hover:bg-[#202B25] text-muted-foreground hover:text-white border border-[#222924] transition-colors"
            title="Recarregar pedidos"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#57EF40]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Content Area: Kanban or Calendar */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'calendar' ? (
          <div className="h-full overflow-y-auto pr-1">
            <OrdersCalendarView
              orders={filteredOrders}
              onOrderClick={handleOpenDetails}
              onDateChange={handleDeliveryDateChange}
            />
          </div>
        ) : (
          /* 8-Column Horizontal Scrollable Kanban */
          <div className="h-full overflow-x-auto pb-2 flex gap-4 scrollbar-thin scrollbar-thumb-[#222924]">
            {KANBAN_COLUMNS.map(col => {
              const colOrders = filteredOrders.filter(o => o.status === col.id);
              const colSum = colOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
              const isOver = dragOverColumn === col.id;

              return (
                <div
                  key={col.id}
                  onDragOver={(e) => handleDragOverColumn(e, col.id)}
                  onDragLeave={handleDragLeaveColumn}
                  onDrop={(e) => handleDropColumn(e, col.id)}
                  className={`w-72 shrink-0 flex flex-col rounded-2xl bg-[#0c0f0d] border transition-all duration-150 ${
                    isOver ? 'border-[#57EF40] bg-[#111513] ring-1 ring-[#57EF40]' : 'border-[#222924]'
                  }`}
                >
                  {/* Column Header */}
                  <div className="p-3.5 border-b border-[#222924] bg-[#111513] rounded-t-2xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${col.color}`}>
                        {col.title}
                      </span>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${col.bgBadge} ${col.color} ${col.borderBadge}`}>
                        {colOrders.length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                      <span>Total:</span>
                      <strong className="text-white font-semibold">{formatCurrency(colSum)}</strong>
                    </div>
                  </div>

                  {/* Cards List */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    {colOrders.length === 0 ? (
                      <div className="p-6 text-center text-[11px] text-muted-foreground/50 border border-dashed border-[#222924]/60 rounded-xl mt-2">
                        Nenhum pedido nesta etapa
                      </div>
                    ) : (
                      colOrders.map(order => (
                        <OrderCard
                          key={order.id}
                          order={order}
                          onOpenDetails={handleOpenDetails}
                          onStatusChange={handleStatusChange}
                          onSyncContaAzul={handleSyncContaAzul}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Fast Order PDV Modal */}
      <FastOrderModal
        isOpen={isFastOrderOpen}
        onClose={() => setIsFastOrderOpen(false)}
        onOrderCreated={loadOrders}
      />

      {/* Order Details Modal */}
      <OrderDetailsModal
        order={selectedOrder}
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedOrder(null);
        }}
        onOrderUpdated={loadOrders}
      />
    </div>
  );
}
