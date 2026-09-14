'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  RefreshCw, 
  AlertTriangle, 
  Bot, 
  Phone, 
  ShoppingCart, 
  Search, 
  Clock, 
  DollarSign, 
  CheckCircle2, 
  MessageSquare, 
  Copy, 
  Send,
  Building,
  ArrowUpRight,
  X
} from 'lucide-react';
import { CustomerRecurrence } from '@omnicrm/shared';
import { api } from '../../../lib/api';
import { formatCurrency, formatPhone } from '../../../lib/utils';
import { useSoftphoneStore } from '../../../stores/useSoftphoneStore';
import { FastOrderModal } from '../../../components/orders/FastOrderModal';

export default function RecurrencePage() {
  const { startCall } = useSoftphoneStore();
  const [customers, setCustomers] = useState<CustomerRecurrence[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState<'ALL' | 'CRITICAL' | 'ALERT' | 'NORMAL'>('ALL');

  // AI Reactivation Copy Modal
  const [reactivationModalOpen, setReactivationModalOpen] = useState(false);
  const [selectedCustomerForCopy, setSelectedCustomerForCopy] = useState<CustomerRecurrence | null>(null);
  const [reactivationCopy, setReactivationCopy] = useState<string>('');
  const [isGeneratingCopy, setIsGeneratingCopy] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);

  // Fast Order modal
  const [fastOrderOpen, setFastOrderOpen] = useState(false);
  const [fastOrderLeadId, setFastOrderLeadId] = useState<string | undefined>(undefined);

  // Load churn alerts
  const loadChurnAlerts = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await api.getChurnAlerts();
      setCustomers(data || []);
    } catch (err) {
      console.error('Failed to load churn alerts:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChurnAlerts();
  }, [loadChurnAlerts]);

  // Filter customers
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const q = searchTerm.toLowerCase();
      const matchesSearch = 
        !searchTerm.trim() ||
        c.name.toLowerCase().includes(q) ||
        c.company?.toLowerCase().includes(q) ||
        c.phone?.includes(q);

      const matchesTier = tierFilter === 'ALL' || c.churnTier === tierFilter;
      return matchesSearch && matchesTier;
    });
  }, [customers, searchTerm, tierFilter]);

  // KPIs
  const kpis = useMemo(() => {
    const totalCount = customers.length;
    const critical = customers.filter(c => c.churnTier === 'CRITICAL');
    const alert = customers.filter(c => c.churnTier === 'ALERT');
    const normal = customers.filter(c => c.churnTier === 'NORMAL');
    const atRiskRevenue = critical.reduce((acc, c) => acc + c.ltv, 0);

    return {
      totalCount,
      criticalCount: critical.length,
      alertCount: alert.length,
      normalCount: normal.length,
      atRiskRevenue
    };
  }, [customers]);

  // Handle Sofia IA Reactivation Copy
  const handleGenerateCopy = async (customer: CustomerRecurrence) => {
    try {
      setSelectedCustomerForCopy(customer);
      setReactivationModalOpen(true);
      setIsGeneratingCopy(true);
      setHasCopied(false);

      const res = await api.generateReactivationPrompt(customer.id);
      setReactivationCopy(res.copy || 'Olá! Sentimos sua falta...');
    } catch (err) {
      setReactivationCopy(
        `Olá ${customer.name}, tudo bem? Aqui é da equipe CRDISK! Notamos que faz um tempinho desde seu último pedido. Preparamos uma condição especial exclusiva para sua reposição esta semana. Podemos conversar?`
      );
    } finally {
      setIsGeneratingCopy(false);
    }
  };

  const handleCopyClipboard = () => {
    navigator.clipboard.writeText(reactivationCopy);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  const handleCallCustomer = (customer: CustomerRecurrence) => {
    startCall({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      company: customer.company
    } as any);
  };

  const handleNewOrder = (customerId: string) => {
    setFastOrderLeadId(customerId);
    setFastOrderOpen(true);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-[#070908] p-6 space-y-6 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              Recorrência & Prevenção de Churn
            </h1>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-[#18201C] text-[#57EF40] border border-[#222924]">
              Motor Sofia IA
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Classificação preditiva de inatividade comercial e reativação multicanal inteligente
          </p>
        </div>

        <button
          type="button"
          onClick={loadChurnAlerts}
          className="px-3 py-2 rounded-xl bg-[#111513] hover:bg-[#18201C] text-muted-foreground hover:text-white border border-[#222924] font-semibold text-xs flex items-center gap-1.5 transition-all self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#57EF40]' : ''}`} />
          <span>Atualizar Métricas</span>
        </button>
      </div>

      {/* KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        <div className="p-4 rounded-2xl bg-[#111513] border border-[#222924] space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>Base Total de Clientes</span>
            <Building className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-white">{kpis.totalCount}</p>
          <p className="text-[10px] text-muted-foreground">Com histórico de compra registrado</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#111513] border border-[#222924] space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>Em Risco Crítico (&gt; 60 dias)</span>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-red-400">{kpis.criticalCount}</p>
          <p className="text-[10px] text-muted-foreground">Necessitam de intervenção imediata</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#111513] border border-[#222924] space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>Em Alerta (31 a 60 dias)</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-amber-400">{kpis.alertCount}</p>
          <p className="text-[10px] text-muted-foreground">Janela ideal para oferta de reposição</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#111513] border border-[#222924] space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>LTV em Risco (Críticos)</span>
            <DollarSign className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-white">{formatCurrency(kpis.atRiskRevenue)}</p>
          <p className="text-[10px] text-muted-foreground">Faturamento histórico sob ameaça de perda</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3.5 rounded-2xl bg-[#111513] border border-[#222924] shrink-0">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por cliente, empresa ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#0c0f0d] border border-[#222924] text-xs text-white placeholder:text-muted-foreground focus:outline-none focus:border-[#57EF40] transition-colors"
          />
        </div>

        {/* Tier Buttons Filter */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#0c0f0d] border border-[#222924]">
          <button
            type="button"
            onClick={() => setTierFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              tierFilter === 'ALL' ? 'bg-[#18201C] text-white font-bold' : 'text-muted-foreground hover:text-white'
            }`}
          >
            Todos ({customers.length})
          </button>
          <button
            type="button"
            onClick={() => setTierFilter('CRITICAL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
              tierFilter === 'CRITICAL' ? 'bg-red-500/20 text-red-300 font-bold border border-red-500/40' : 'text-red-400 hover:text-red-300'
            }`}
          >
            Crítico ({kpis.criticalCount})
          </button>
          <button
            type="button"
            onClick={() => setTierFilter('ALERT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
              tierFilter === 'ALERT' ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40' : 'text-amber-400 hover:text-amber-300'
            }`}
          >
            Alerta ({kpis.alertCount})
          </button>
          <button
            type="button"
            onClick={() => setTierFilter('NORMAL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
              tierFilter === 'NORMAL' ? 'bg-[#57EF40]/20 text-[#57EF40] font-bold border border-[#57EF40]/40' : 'text-muted-foreground hover:text-white'
            }`}
          >
            Normal ({kpis.normalCount})
          </button>
        </div>
      </div>

      {/* Customers Recurrence Table */}
      <div className="flex-1 rounded-2xl border border-[#222924] bg-[#0c0f0d] overflow-hidden shadow-xl flex flex-col">
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#111513] border-b border-[#222924] text-[10px] text-muted-foreground uppercase sticky top-0 z-10">
              <tr>
                <th className="py-3 px-4">Cliente & Contato</th>
                <th className="py-3 px-4 text-center">Total de Pedidos</th>
                <th className="py-3 px-4 text-right">LTV Acumulado</th>
                <th className="py-3 px-4 text-center">Última Compra</th>
                <th className="py-3 px-4 text-center">Inatividade</th>
                <th className="py-3 px-4 text-center">Classificação de Risco</th>
                <th className="py-3 px-4 text-right">Ações de Reativação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222924]">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground text-xs">
                    Nenhum cliente encontrado com os filtros atuais.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(c => {
                  return (
                    <tr key={c.id} className="hover:bg-[#111513] transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-white">{c.name}</div>
                        <div className="text-[10px] text-muted-foreground flex items-center gap-2 mt-0.5">
                          {c.company && <span>{c.company}</span>}
                          {c.phone && <span className="font-mono">{formatPhone(c.phone)}</span>}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center font-mono font-bold text-white text-sm">
                        {c.totalOrdersCount}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-[#57EF40]">
                        {formatCurrency(c.ltv)}
                      </td>

                      <td className="py-3 px-4 text-center text-muted-foreground font-mono text-[11px]">
                        {c.lastOrderAt ? new Date(c.lastOrderAt).toLocaleDateString('pt-BR') : 'Nunca comprou'}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="font-mono font-bold text-xs text-white">
                          {c.daysSinceLastOrder} dias
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        {c.churnTier === 'CRITICAL' ? (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/30 flex items-center justify-center gap-1 mx-auto w-fit">
                            <AlertTriangle className="w-3 h-3" />
                            Risco Crítico (&gt;60d)
                          </span>
                        ) : c.churnTier === 'ALERT' ? (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center gap-1 mx-auto w-fit">
                            <Clock className="w-3 h-3" />
                            Em Alerta (31-60d)
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#57EF40]/10 text-[#57EF40] border border-[#57EF40]/30 flex items-center justify-center gap-1 mx-auto w-fit">
                            <CheckCircle2 className="w-3 h-3" />
                            Ativo (&lt;30d)
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Sofia IA Reactivation Copy Button */}
                          <button
                            type="button"
                            onClick={() => handleGenerateCopy(c)}
                            className="px-2.5 py-1 rounded-lg bg-purple-950/40 hover:bg-purple-900/50 text-purple-300 border border-purple-800/40 font-bold text-[11px] flex items-center gap-1 transition-all"
                            title="Gerar Copy de Reativação com IA"
                          >
                            <Bot className="w-3 h-3 text-purple-400" />
                            <span>Sofia IA</span>
                          </button>

                          {/* Softphone Dialer */}
                          {c.phone && (
                            <button
                              type="button"
                              onClick={() => handleCallCustomer(c)}
                              className="p-1.5 rounded-lg bg-[#18201C] hover:bg-[#202B25] text-[#57EF40] border border-[#222924] transition-colors"
                              title="Ligar agora para o cliente"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* New Order Fast Emission */}
                          <button
                            type="button"
                            onClick={() => handleNewOrder(c.id)}
                            className="p-1.5 rounded-lg bg-[#18201C] hover:bg-[#202B25] text-white border border-[#222924] transition-colors"
                            title="Emitir novo pedido de venda"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sofia IA Reactivation Modal */}
      {reactivationModalOpen && selectedCustomerForCopy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-[#0c0f0d] border border-[#222924] rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#222924] flex items-center justify-between bg-[#111513]">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-purple-400" />
                <div>
                  <h3 className="font-bold text-sm text-white">Copy de Reativação Sofia IA</h3>
                  <p className="text-[11px] text-muted-foreground">Personalizada para {selectedCustomerForCopy.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReactivationModalOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-white hover:bg-[#18201C]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3 rounded-xl bg-[#111513] border border-[#222924] flex justify-between text-xs font-mono">
                <span>Inatividade: <strong className="text-amber-400">{selectedCustomerForCopy.daysSinceLastOrder} dias</strong></span>
                <span>LTV: <strong className="text-[#57EF40]">{formatCurrency(selectedCustomerForCopy.ltv)}</strong></span>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">
                  Mensagem Pronta para WhatsApp
                </label>
                <div className="relative">
                  <textarea
                    rows={6}
                    value={reactivationCopy}
                    onChange={(e) => setReactivationCopy(e.target.value)}
                    disabled={isGeneratingCopy}
                    className="w-full p-3 rounded-xl bg-[#111513] border border-[#222924] text-xs text-white leading-relaxed focus:outline-none focus:border-[#57EF40] resize-none"
                  />
                  {isGeneratingCopy && (
                    <div className="absolute inset-0 bg-[#111513]/80 backdrop-blur-xs flex items-center justify-center rounded-xl">
                      <div className="flex items-center gap-2 text-xs font-semibold text-purple-300">
                        <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />
                        <span>Sofia IA criando oferta personalizada...</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-[#222924] flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleCopyClipboard}
                  className="px-3 py-2 rounded-xl bg-[#18201C] hover:bg-[#202B25] text-xs font-semibold text-white border border-[#222924] flex items-center gap-1.5 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{hasCopied ? 'Copiado!' : 'Copiar Texto'}</span>
                </button>

                <a
                  href={`/chat?leadId=${selectedCustomerForCopy.id}`}
                  className="px-4 py-2 rounded-xl bg-[#57EF40] hover:bg-[#65C556] text-[#070908] font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-[#57EF40]/10"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Abrir no Chat WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fast Order Modal */}
      <FastOrderModal
        isOpen={fastOrderOpen}
        onClose={() => {
          setFastOrderOpen(false);
          setFastOrderLeadId(undefined);
        }}
        onOrderCreated={loadChurnAlerts}
        initialLeadId={fastOrderLeadId}
      />
    </div>
  );
}
