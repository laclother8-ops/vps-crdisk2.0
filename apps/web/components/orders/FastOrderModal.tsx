'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  ShoppingCart, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  AlertTriangle, 
  Calendar, 
  DollarSign, 
  Truck, 
  Percent, 
  Check, 
  Building,
  User,
  PackageCheck
} from 'lucide-react';
import { OrderStatus, Product } from '@omnicrm/shared';
import { api } from '../../lib/api';
import { formatCurrency } from '../../lib/utils';

interface FastOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: () => void;
  initialLeadId?: string;
}

interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
}

export function FastOrderModal({
  isOpen,
  onClose,
  onOrderCreated,
  initialLeadId
}: FastOrderModalProps) {
  // Leads for autocomplete
  const [leads, setLeads] = useState<any[]>([]);
  const [leadSearch, setLeadSearch] = useState('');
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [isSearchingLeads, setIsSearchingLeads] = useState(false);

  // Products catalog
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);

  // Financial inputs & meta
  const [discount, setDiscount] = useState<number>(0);
  const [freight, setFreight] = useState<number>(0);
  const [deliveryDate, setDeliveryDate] = useState<string>('');
  const [initialStatus, setInitialStatus] = useState<OrderStatus>(OrderStatus.APROVADO);
  const [notes, setNotes] = useState<string>('');
  const [syncContaAzul, setSyncContaAzul] = useState<boolean>(true);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load products and initial leads
  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      try {
        const [prodRes, leadsRes] = await Promise.all([
          api.getProducts({ activeOnly: true }),
          api.getLeads({ limit: 20 })
        ]);
        setProducts(prodRes || []);
        setLeads(leadsRes?.leads || leadsRes || []);

        if (initialLeadId) {
          const matched = (leadsRes?.leads || leadsRes || []).find((l: any) => l.id === initialLeadId);
          if (matched) setSelectedLead(matched);
        }
      } catch (err) {
        console.error('Failed to load modal data:', err);
      }
    };
    loadData();
  }, [isOpen, initialLeadId]);

  // Lead search filter
  const filteredLeads = useMemo(() => {
    if (!leadSearch.trim()) return leads.slice(0, 5);
    const q = leadSearch.toLowerCase();
    return leads.filter(l => 
      l.name?.toLowerCase().includes(q) || 
      l.company?.toLowerCase().includes(q) || 
      l.phone?.includes(q)
    ).slice(0, 5);
  }, [leads, leadSearch]);

  // Product search filter
  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return products;
    const q = productSearch.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.sku?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q)
    );
  }, [products, productSearch]);

  // Cart operations
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1, unitPrice: Number(product.price) }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  // Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  }, [cart]);

  const totalAmount = useMemo(() => {
    return Math.max(0, subtotal - (Number(discount) || 0) + (Number(freight) || 0));
  }, [subtotal, discount, freight]);

  // Submit order
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) {
      setErrorMessage('Selecione um cliente para vincular o pedido.');
      return;
    }
    if (cart.length === 0) {
      setErrorMessage('Adicione pelo menos um item ao pedido.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      await api.createOrder({
        leadId: selectedLead.id,
        items: cart.map(item => ({
          productId: item.product.id,
          productName: item.product.name,
          sku: item.product.sku,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.quantity * item.unitPrice
        })),
        discount: Number(discount) || 0,
        freight: Number(freight) || 0,
        deliveryDate: deliveryDate ? new Date(deliveryDate).toISOString() : null,
        initialStatus,
        notes,
        syncContaAzul
      });

      onOrderCreated();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao emitir pedido.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-[#0c0f0d] border border-[#222924] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#222924] flex items-center justify-between bg-[#111513]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#57EF40]/10 border border-[#57EF40]/30 text-[#57EF40]">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Emissão Rápida de Pedido <span className="text-xs text-[#57EF40] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#18201C] border border-[#222924]">PDV</span>
              </h3>
              <p className="text-xs text-muted-foreground">
                Gere pedidos, reserve estoque e integre automaticamente com Conta Azul
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-white hover:bg-[#18201C] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body (2 Columns) */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Client & Product Selection (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Client Autocomplete */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center justify-between">
                <span>1. Cliente Solicitante *</span>
                {selectedLead && (
                  <button
                    type="button"
                    onClick={() => { setSelectedLead(null); setLeadSearch(''); }}
                    className="text-[11px] text-[#57EF40] hover:underline normal-case font-normal"
                  >
                    Trocar cliente
                  </button>
                )}
              </label>

              {selectedLead ? (
                <div className="p-3 rounded-xl bg-[#111513] border border-[#57EF40]/40 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#57EF40]/10 border border-[#57EF40]/20 flex items-center justify-center font-bold text-sm text-[#57EF40]">
                      {selectedLead.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-white">{selectedLead.name}</h5>
                      <p className="text-[11px] text-muted-foreground">{selectedLead.company || selectedLead.phone}</p>
                    </div>
                  </div>
                  <Check className="w-4 h-4 text-[#57EF40]" />
                </div>
              ) : (
                <div className="space-y-1.5 relative">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Buscar por nome, empresa ou telefone..."
                      value={leadSearch}
                      onChange={(e) => setLeadSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#111513] border border-[#222924] text-xs text-white placeholder:text-muted-foreground focus:outline-none focus:border-[#57EF40] transition-colors"
                    />
                  </div>
                  {leadSearch.trim() && (
                    <div className="absolute z-10 w-full mt-1 bg-[#111513] border border-[#222924] rounded-xl shadow-xl overflow-hidden">
                      {filteredLeads.length > 0 ? (
                        filteredLeads.map(lead => (
                          <div
                            key={lead.id}
                            onClick={() => { setSelectedLead(lead); setLeadSearch(''); }}
                            className="p-2.5 hover:bg-[#18201C] cursor-pointer flex items-center justify-between border-b border-[#222924] last:border-0"
                          >
                            <div>
                              <p className="font-bold text-xs text-white">{lead.name}</p>
                              <p className="text-[10px] text-muted-foreground">{lead.company || lead.phone}</p>
                            </div>
                            <span className="text-[10px] text-[#57EF40] font-semibold">Selecionar</span>
                          </div>
                        ))
                      ) : (
                        <div className="p-3 text-center text-xs text-muted-foreground">
                          Nenhum cliente encontrado
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Product Catalog Grid / Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center justify-between">
                <span>2. Itens do Catálogo</span>
                <span className="text-[11px] text-muted-foreground font-normal">
                  {products.length} produtos disponíveis
                </span>
              </label>

              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Pesquisar produto por nome, código SKU..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#111513] border border-[#222924] text-xs text-white placeholder:text-muted-foreground focus:outline-none focus:border-[#57EF40] transition-colors"
                />
              </div>

              <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                {filteredProducts.map(product => {
                  const isLowStock = product.stockQuantity <= product.minStockAlert;
                  const isOutOfStock = product.stockQuantity <= 0;

                  return (
                    <div
                      key={product.id}
                      className="p-2.5 rounded-xl bg-[#111513] border border-[#222924] hover:border-[#38463e] flex items-center justify-between transition-colors"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-2">
                          <h6 className="font-bold text-xs text-white truncate">{product.name}</h6>
                          {product.sku && (
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#18201C] text-muted-foreground">
                              {product.sku}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-[11px]">
                          <span className="text-[#57EF40] font-bold font-mono">
                            {formatCurrency(Number(product.price))}
                          </span>
                          <span className={`text-[10px] font-semibold flex items-center gap-1 ${
                            isOutOfStock 
                              ? 'text-red-400' 
                              : isLowStock 
                              ? 'text-amber-400' 
                              : 'text-muted-foreground'
                          }`}>
                            {isOutOfStock ? (
                              <AlertTriangle className="w-3 h-3 text-red-400" />
                            ) : null}
                            Estoque: {product.stockQuantity} un
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => addToCart(product)}
                        className="px-2.5 py-1.5 rounded-lg bg-[#18201C] hover:bg-[#57EF40] text-white hover:text-[#070908] font-bold text-xs flex items-center gap-1 transition-all border border-[#222924]"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Adicionar</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary & Financials (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between p-4 rounded-2xl bg-[#111513] border border-[#222924] space-y-4">
            <div>
              <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-3 flex items-center justify-between">
                <span>Resumo do Pedido</span>
                <span className="text-xs text-[#57EF40] font-mono">
                  {cart.length} {cart.length === 1 ? 'item' : 'itens'}
                </span>
              </h4>

              {/* Cart Items List */}
              <div className="max-h-44 overflow-y-auto space-y-2 pr-1">
                {cart.length === 0 ? (
                  <div className="p-6 text-center text-xs text-muted-foreground border border-dashed border-[#222924] rounded-xl">
                    Nenhum item selecionado. Clique em "Adicionar" ao lado dos produtos.
                  </div>
                ) : (
                  cart.map(item => (
                    <div
                      key={item.product.id}
                      className="p-2 rounded-xl bg-[#0c0f0d] border border-[#222924] flex items-center justify-between text-xs"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-bold text-white truncate">{item.product.name}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          {formatCurrency(item.unitPrice)} cada
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center rounded-lg bg-[#18201C] border border-[#222924]">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product.id, -1)}
                            className="p-1 hover:text-[#57EF40] transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center font-mono font-bold text-[11px] text-white">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product.id, 1)}
                            className="p-1 hover:text-[#57EF40] transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.product.id)}
                          className="p-1 text-muted-foreground hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Financial Inputs: Discount, Freight, Delivery Date */}
              <div className="mt-4 pt-3 border-t border-[#222924] space-y-2.5 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground block mb-1">
                      Desconto (R$)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={discount || ''}
                      onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                      placeholder="0,00"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#0c0f0d] border border-[#222924] text-white font-mono text-xs focus:outline-none focus:border-[#57EF40]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground block mb-1">
                      Frete (R$)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={freight || ''}
                      onChange={(e) => setFreight(parseFloat(e.target.value) || 0)}
                      placeholder="0,00"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#0c0f0d] border border-[#222924] text-white font-mono text-xs focus:outline-none focus:border-[#57EF40]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground block mb-1">
                    Previsão de Entrega
                  </label>
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#0c0f0d] border border-[#222924] text-white text-xs focus:outline-none focus:border-[#57EF40]"
                  />
                </div>

                {/* Initial Stage & Conta Azul Integration */}
                <div className="pt-2 border-t border-[#222924] space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-semibold text-muted-foreground">
                      Etapa Inicial
                    </label>
                    <select
                      value={initialStatus}
                      onChange={(e) => setInitialStatus(e.target.value as OrderStatus)}
                      className="px-2 py-1 rounded-lg bg-[#0c0f0d] border border-[#222924] text-xs text-white focus:outline-none focus:border-[#57EF40]"
                    >
                      <option value={OrderStatus.ORCAMENTO}>Orçamento</option>
                      <option value={OrderStatus.APROVADO}>Pedido Aprovado</option>
                      <option value={OrderStatus.EM_SEPARACAO}>Em Separação</option>
                    </select>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={syncContaAzul}
                      onChange={(e) => setSyncContaAzul(e.target.checked)}
                      className="rounded border-[#222924] bg-[#0c0f0d] text-[#57EF40] focus:ring-0"
                    />
                    <span className="text-[11px] text-gray-300 font-semibold">
                      Sincronizar venda com Conta Azul
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Total Calculation & Action Submit */}
            <div className="pt-3 border-t border-[#222924] space-y-3">
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-muted-foreground font-mono text-[11px]">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-red-400 font-mono text-[11px]">
                    <span>Desconto:</span>
                    <span>- {formatCurrency(discount)}</span>
                  </div>
                )}
                {freight > 0 && (
                  <div className="flex justify-between text-muted-foreground font-mono text-[11px]">
                    <span>Frete:</span>
                    <span>+ {formatCurrency(freight)}</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline pt-1 border-t border-[#222924]">
                  <span className="font-bold text-white text-xs">TOTAL:</span>
                  <span className="font-bold font-mono text-base text-[#57EF40]">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
              </div>

              {errorMessage && (
                <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                  {errorMessage}
                </div>
              )}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-[#57EF40] hover:bg-[#65C556] text-[#070908] font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#57EF40]/10 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                <PackageCheck className="w-4 h-4" />
                <span>{isSubmitting ? 'Processando Pedido...' : 'Emitir Pedido de Venda'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
