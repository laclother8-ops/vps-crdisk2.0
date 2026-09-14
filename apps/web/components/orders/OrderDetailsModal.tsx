'use client';

import React, { useState } from 'react';
import { 
  X, 
  Package, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Building, 
  Phone, 
  Clock, 
  FileText,
  DollarSign
} from 'lucide-react';
import { Order, OrderStatus } from '@omnicrm/shared';
import { formatCurrency, formatPhone } from '../../lib/utils';
import { api } from '../../lib/api';

interface OrderDetailsModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onOrderUpdated: () => void;
}

const ALL_STATUSES = [
  { value: OrderStatus.ORCAMENTO, label: 'Orçamento' },
  { value: OrderStatus.APROVADO, label: 'Pedido Aprovado' },
  { value: OrderStatus.EM_SEPARACAO, label: 'Em Separação' },
  { value: OrderStatus.PRODUCAO, label: 'Em Produção' },
  { value: OrderStatus.FATURADO, label: 'Faturado' },
  { value: OrderStatus.EM_ROTA, label: 'Em Rota' },
  { value: OrderStatus.ENTREGUE, label: 'Entregue / Concluído' },
  { value: OrderStatus.CANCELADO, label: 'Cancelado' },
];

export function OrderDetailsModal({
  order,
  isOpen,
  onClose,
  onOrderUpdated
}: OrderDetailsModalProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSyncingContaAzul, setIsSyncingContaAzul] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState<string>(
    order?.deliveryDate ? new Date(order.deliveryDate).toISOString().split('T')[0] : ''
  );
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  React.useEffect(() => {
    if (order?.deliveryDate) {
      setDeliveryDate(new Date(order.deliveryDate).toISOString().split('T')[0]);
    } else {
      setDeliveryDate('');
    }
    setSyncStatusMsg(null);
  }, [order]);

  if (!isOpen || !order) return null;

  const handleStatusSelect = async (newStatus: OrderStatus) => {
    try {
      setIsUpdating(true);
      await api.updateOrderStatus(order.id, newStatus);
      onOrderUpdated();
    } catch (err: any) {
      alert(err.message || 'Erro ao alterar status do pedido.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveDeliveryDate = async () => {
    try {
      setIsUpdating(true);
      await api.updateOrderDeliveryDate(order.id, deliveryDate ? new Date(deliveryDate).toISOString() : null);
      onOrderUpdated();
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar previsão de entrega.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSyncContaAzul = async () => {
    try {
      setIsSyncingContaAzul(true);
      setSyncStatusMsg(null);
      const res = await api.syncContaAzulOrder(order.id);
      setSyncStatusMsg(res.message || 'Sincronizado com sucesso no Conta Azul!');
      onOrderUpdated();
    } catch (err: any) {
      setSyncStatusMsg(`Falha na sincronização: ${err.message}`);
    } finally {
      setIsSyncingContaAzul(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-[#0c0f0d] border border-[#222924] rounded-2xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#222924] flex items-center justify-between bg-[#111513]">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-sm text-[#57EF40]">{order.code}</span>
              <span className="text-xs text-muted-foreground font-mono">
                {new Date(order.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <h3 className="text-sm font-bold text-white mt-0.5">
              Detalhes do Pedido de Venda
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-white hover:bg-[#18201C] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Customer & Status Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl bg-[#111513] border border-[#222924] space-y-1.5">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Cliente</p>
              <h5 className="font-bold text-xs text-white">{order.lead?.name || 'Cliente Sem Nome'}</h5>
              {order.lead?.company && (
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Building className="w-3 h-3 text-muted-foreground/60" />
                  {order.lead.company}
                </p>
              )}
              {order.lead?.phone && (
                <p className="text-[11px] text-muted-foreground font-mono flex items-center gap-1">
                  <Phone className="w-3 h-3 text-muted-foreground/60" />
                  {formatPhone(order.lead.phone)}
                </p>
              )}
            </div>

            <div className="p-3.5 rounded-xl bg-[#111513] border border-[#222924] space-y-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Status Atual</p>
              <select
                value={order.status}
                disabled={isUpdating}
                onChange={(e) => handleStatusSelect(e.target.value as OrderStatus)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#18201C] border border-[#222924] text-xs font-semibold text-white focus:outline-none focus:border-[#57EF40]"
              >
                {ALL_STATUSES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>

              {/* Conta Azul Integration status */}
              <div className="pt-2 border-t border-[#222924] flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">Conta Azul:</span>
                <button
                  type="button"
                  disabled={isSyncingContaAzul}
                  onClick={handleSyncContaAzul}
                  className="px-2 py-1 rounded-md bg-[#18201C] hover:bg-[#202B25] text-[10px] font-semibold text-gray-200 hover:text-white border border-[#222924] flex items-center gap-1 transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncingContaAzul ? 'animate-spin text-[#57EF40]' : ''}`} />
                  <span>{isSyncingContaAzul ? 'Sincronizando...' : 'Sincronizar Agora'}</span>
                </button>
              </div>
            </div>
          </div>

          {syncStatusMsg && (
            <div className="p-2.5 rounded-xl bg-[#111513] border border-[#222924] text-xs text-[#57EF40] font-mono">
              {syncStatusMsg}
            </div>
          )}

          {/* Delivery Rescheduling */}
          <div className="p-3.5 rounded-xl bg-[#111513] border border-[#222924] flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#57EF40]" />
              <div>
                <p className="text-xs font-bold text-white">Previsão de Entrega</p>
                <p className="text-[10px] text-muted-foreground">Reagende a data de expedição/entrega</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-[#18201C] border border-[#222924] text-xs text-white focus:outline-none focus:border-[#57EF40]"
              />
              <button
                type="button"
                disabled={isUpdating}
                onClick={handleSaveDeliveryDate}
                className="px-3 py-1.5 rounded-lg bg-[#57EF40] hover:bg-[#65C556] text-[#070908] font-bold text-xs transition-all disabled:opacity-50"
              >
                Salvar Data
              </button>
            </div>
          </div>

          {/* Order Items Table */}
          <div className="space-y-2">
            <h5 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Itens do Pedido</h5>
            <div className="border border-[#222924] rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#111513] border-b border-[#222924] text-[10px] text-muted-foreground uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Item</th>
                    <th className="py-2.5 px-3">SKU</th>
                    <th className="py-2.5 px-3 text-center">Qtd</th>
                    <th className="py-2.5 px-3 text-right">Unitário</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222924] bg-[#0c0f0d]">
                  {(order.items || []).map((item, idx) => (
                    <tr key={idx} className="hover:bg-[#111513] transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-white">{item.productName}</td>
                      <td className="py-2.5 px-3 text-muted-foreground font-mono text-[11px]">{item.sku || '-'}</td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-white">{item.quantity}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">{formatCurrency(Number(item.unitPrice))}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-[#57EF40]">{formatCurrency(Number(item.totalPrice))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Totals */}
          <div className="p-4 rounded-xl bg-[#111513] border border-[#222924] flex justify-between items-center text-xs">
            <div className="space-y-1 text-muted-foreground text-[11px]">
              <p>Desconto: <span className="text-red-400 font-mono">-{formatCurrency(Number(order.discount || 0))}</span></p>
              <p>Frete: <span className="text-white font-mono">+{formatCurrency(Number(order.freight || 0))}</span></p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Valor Total</span>
              <span className="text-lg font-bold font-mono text-[#57EF40]">
                {formatCurrency(Number(order.totalAmount))}
              </span>
            </div>
          </div>

          {/* Observações */}
          {order.notes && (
            <div className="p-3 rounded-xl bg-[#111513] border border-[#222924] text-xs space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Observações do Pedido</p>
              <p className="text-muted-foreground leading-relaxed">{order.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
