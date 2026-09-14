'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  AlertTriangle, 
  TrendingUp, 
  ArrowDownRight, 
  ArrowUpRight, 
  RefreshCw, 
  X, 
  History,
  DollarSign,
  Percent,
  CheckCircle2,
  Boxes
} from 'lucide-react';
import { Product, StockMovement, StockMovementType } from '@omnicrm/shared';
import { api } from '../../lib/api';
import { formatCurrency } from '../../lib/utils';

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  // Modals
  const [isNewProductOpen, setIsNewProductOpen] = useState(false);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [selectedProductForMovement, setSelectedProductForMovement] = useState<Product | null>(null);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [movementsHistory, setMovementsHistory] = useState<StockMovement[]>([]);

  // New Product Form State
  const [newProdName, setNewProdName] = useState('');
  const [newProdSku, setNewProdSku] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('');
  const [newProdPrice, setNewProdPrice] = useState<number>(0);
  const [newProdCost, setNewProdCost] = useState<number>(0);
  const [newProdStock, setNewProdStock] = useState<number>(0);
  const [newProdMinAlert, setNewProdMinAlert] = useState<number>(5);
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);

  // Movement Form State
  const [movementType, setMovementType] = useState<StockMovementType>(StockMovementType.ENTRADA);
  const [movementQty, setMovementQty] = useState<number>(1);
  const [movementReason, setMovementReason] = useState<string>('');
  const [isSubmittingMovement, setIsSubmittingMovement] = useState(false);

  // Load products
  const loadProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await api.getProducts();
      setProducts(data || []);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Load history movements
  const loadHistory = async (productId?: string) => {
    try {
      const data = await api.getStockMovements({ productId, limit: 50 });
      setMovementsHistory(data || []);
      setIsHistoryDrawerOpen(true);
    } catch (err) {
      console.error('Failed to load movements history:', err);
    }
  };

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = 
        !searchTerm.trim() ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCat = categoryFilter === 'ALL' || p.category === categoryFilter;
      const matchesLowStock = !onlyLowStock || (p.stockQuantity <= p.minStockAlert);

      return matchesSearch && matchesCat && matchesLowStock;
    });
  }, [products, searchTerm, categoryFilter, onlyLowStock]);

  // Inventory Overview Metrics
  const metrics = useMemo(() => {
    const totalItems = products.reduce((acc, p) => acc + p.stockQuantity, 0);
    const totalCostValue = products.reduce((acc, p) => acc + (p.stockQuantity * Number(p.costPrice || 0)), 0);
    const totalSaleValue = products.reduce((acc, p) => acc + (p.stockQuantity * Number(p.price)), 0);
    const lowStockCount = products.filter(p => p.stockQuantity <= p.minStockAlert).length;

    return {
      totalProducts: products.length,
      totalItems,
      totalCostValue,
      totalSaleValue,
      lowStockCount
    };
  }, [products]);

  // Handle Create Product
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) return;

    try {
      setIsSubmittingProduct(true);
      await api.createProduct({
        name: newProdName,
        sku: newProdSku || undefined,
        category: newProdCategory || undefined,
        price: Number(newProdPrice) || 0,
        costPrice: Number(newProdCost) || 0,
        stockQuantity: Number(newProdStock) || 0,
        minStockAlert: Number(newProdMinAlert) || 5
      });

      // Reset form
      setNewProdName('');
      setNewProdSku('');
      setNewProdCategory('');
      setNewProdPrice(0);
      setNewProdCost(0);
      setNewProdStock(0);
      setNewProdMinAlert(5);
      setIsNewProductOpen(false);

      loadProducts();
    } catch (err: any) {
      alert(`Erro ao criar produto: ${err.message}`);
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  // Handle Record Movement
  const handleRecordMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForMovement) return;

    try {
      setIsSubmittingMovement(true);
      await api.recordStockMovement({
        productId: selectedProductForMovement.id,
        type: movementType,
        quantity: Number(movementQty),
        reason: movementReason || 'Ajuste manual de estoque'
      });

      setIsMovementModalOpen(false);
      setSelectedProductForMovement(null);
      setMovementReason('');
      setMovementQty(1);

      loadProducts();
    } catch (err: any) {
      alert(`Erro ao movimentar estoque: ${err.message}`);
    } finally {
      setIsSubmittingMovement(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-[#070908] p-6 space-y-6 overflow-hidden">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              Controle de Estoque & Catálogo
            </h1>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-[#18201C] text-[#57EF40] border border-[#222924]">
              {products.length} Itens
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Gestão física de estoque, margem de lucro, alertas de reposição e histórico de movimentações
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => loadHistory()}
            className="px-3 py-2 rounded-xl bg-[#111513] hover:bg-[#18201C] text-muted-foreground hover:text-white border border-[#222924] font-semibold text-xs flex items-center gap-1.5 transition-all"
          >
            <History className="w-4 h-4" />
            <span>Histórico de Movimentações</span>
          </button>

          <button
            type="button"
            onClick={() => setIsNewProductOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#57EF40] hover:bg-[#65C556] text-[#070908] font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-[#57EF40]/10 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Produto</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        <div className="p-4 rounded-2xl bg-[#111513] border border-[#222924] space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>Total em Peças / Unidades</span>
            <Boxes className="w-4 h-4 text-[#57EF40]" />
          </div>
          <p className="text-2xl font-bold font-mono text-white">{metrics.totalItems}</p>
          <p className="text-[10px] text-muted-foreground">Distribuídos em {metrics.totalProducts} produtos</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#111513] border border-[#222924] space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>Valor em Custo</span>
            <DollarSign className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-white">{formatCurrency(metrics.totalCostValue)}</p>
          <p className="text-[10px] text-muted-foreground">Investimento total imobilizado</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#111513] border border-[#222924] space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>Valor em Venda Potencial</span>
            <TrendingUp className="w-4 h-4 text-[#57EF40]" />
          </div>
          <p className="text-2xl font-bold font-mono text-[#57EF40]">{formatCurrency(metrics.totalSaleValue)}</p>
          <p className="text-[10px] text-muted-foreground">Faturamento projetado a preço de tabela</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#111513] border border-[#222924] space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>Estoque Baixo / Reposição</span>
            <AlertTriangle className={`w-4 h-4 ${metrics.lowStockCount > 0 ? 'text-amber-400' : 'text-muted-foreground'}`} />
          </div>
          <p className={`text-2xl font-bold font-mono ${metrics.lowStockCount > 0 ? 'text-amber-400' : 'text-white'}`}>
            {metrics.lowStockCount}
          </p>
          <p className="text-[10px] text-muted-foreground">Abaixo do limite de segurança</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3.5 rounded-2xl bg-[#111513] border border-[#222924] shrink-0">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por nome do produto ou SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#0c0f0d] border border-[#222924] text-xs text-white placeholder:text-muted-foreground focus:outline-none focus:border-[#57EF40] transition-colors"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-[#0c0f0d] border border-[#222924] text-xs text-white focus:outline-none focus:border-[#57EF40]"
          >
            <option value="ALL">Todas Categorias</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer text-xs">
            <input
              type="checkbox"
              checked={onlyLowStock}
              onChange={(e) => setOnlyLowStock(e.target.checked)}
              className="rounded border-[#222924] bg-[#0c0f0d] text-[#57EF40] focus:ring-0"
            />
            <span className="text-gray-300 font-medium">Apenas Estoque Crítico</span>
          </label>

          <button
            type="button"
            onClick={loadProducts}
            className="p-1.5 rounded-lg bg-[#18201C] hover:bg-[#202B25] text-muted-foreground hover:text-white border border-[#222924] transition-colors"
            title="Atualizar lista"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#57EF40]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="flex-1 rounded-2xl border border-[#222924] bg-[#0c0f0d] overflow-hidden shadow-xl flex flex-col">
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#111513] border-b border-[#222924] text-[10px] text-muted-foreground uppercase sticky top-0 z-10">
              <tr>
                <th className="py-3 px-4">Produto & SKU</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4 text-right">Preço de Custo</th>
                <th className="py-3 px-4 text-right">Preço de Venda</th>
                <th className="py-3 px-4 text-center">Margem Lucro</th>
                <th className="py-3 px-4 text-center">Estoque Físico</th>
                <th className="py-3 px-4 text-center">Status Estoque</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222924]">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground text-xs">
                    Nenhum produto cadastrado ou correspondente ao filtro.
                  </td>
                </tr>
              ) : (
                filteredProducts.map(product => {
                  const cost = Number(product.costPrice || 0);
                  const price = Number(product.price);
                  const profitMargin = price > 0 ? ((price - cost) / price) * 100 : 0;
                  const isOutOfStock = product.stockQuantity <= 0;
                  const isLowStock = product.stockQuantity <= product.minStockAlert;

                  return (
                    <tr key={product.id} className="hover:bg-[#111513] transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-white">{product.name}</div>
                        <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
                          {product.sku || 'Sem SKU'}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#18201C] text-muted-foreground border border-[#222924]">
                          {product.category || 'Geral'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-muted-foreground">
                        {cost > 0 ? formatCurrency(cost) : '-'}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-white">
                        {formatCurrency(price)}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                          profitMargin >= 40 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                            : profitMargin > 15 
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' 
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}>
                          {profitMargin.toFixed(1)}%
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center font-mono font-bold text-white text-sm">
                        {product.stockQuantity}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {isOutOfStock ? (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/30 flex items-center justify-center gap-1 mx-auto w-fit">
                            <AlertTriangle className="w-3 h-3" />
                            Esgotado
                          </span>
                        ) : isLowStock ? (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center gap-1 mx-auto w-fit">
                            <AlertTriangle className="w-3 h-3" />
                            Estoque Baixo ({product.stockQuantity}/{product.minStockAlert})
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#57EF40]/10 text-[#57EF40] border border-[#57EF40]/30 flex items-center justify-center gap-1 mx-auto w-fit">
                            <CheckCircle2 className="w-3 h-3" />
                            Normal
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedProductForMovement(product);
                              setIsMovementModalOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-[#18201C] hover:bg-[#202B25] text-white border border-[#222924] font-semibold text-[11px] transition-colors"
                          >
                            Movimentar
                          </button>
                          <button
                            type="button"
                            onClick={() => loadHistory(product.id)}
                            className="p-1 rounded-lg bg-[#18201C] hover:bg-[#202B25] text-muted-foreground hover:text-white border border-[#222924] transition-colors"
                            title="Ver histórico de movimentações"
                          >
                            <History className="w-3.5 h-3.5" />
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

      {/* New Product Modal */}
      {isNewProductOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-[#0c0f0d] border border-[#222924] rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#222924] flex items-center justify-between bg-[#111513]">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-[#57EF40]" />
                <h3 className="font-bold text-sm text-white">Cadastrar Novo Produto</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewProductOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-white hover:bg-[#18201C]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">Nome do Produto *</label>
                <input
                  type="text"
                  required
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder="Ex: Teclado Mecânico RGB Pro"
                  className="w-full px-3 py-2 rounded-xl bg-[#111513] border border-[#222924] text-xs text-white focus:outline-none focus:border-[#57EF40]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1">Código SKU</label>
                  <input
                    type="text"
                    value={newProdSku}
                    onChange={(e) => setNewProdSku(e.target.value)}
                    placeholder="TEC-MEC-01"
                    className="w-full px-3 py-2 rounded-xl bg-[#111513] border border-[#222924] text-xs text-white font-mono focus:outline-none focus:border-[#57EF40]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1">Categoria</label>
                  <input
                    type="text"
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value)}
                    placeholder="Periféricos"
                    className="w-full px-3 py-2 rounded-xl bg-[#111513] border border-[#222924] text-xs text-white focus:outline-none focus:border-[#57EF40]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1">Preço de Custo (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProdCost || ''}
                    onChange={(e) => setNewProdCost(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-xl bg-[#111513] border border-[#222924] text-xs text-white font-mono focus:outline-none focus:border-[#57EF40]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1">Preço de Venda (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newProdPrice || ''}
                    onChange={(e) => setNewProdPrice(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-xl bg-[#111513] border border-[#222924] text-xs text-white font-mono focus:outline-none focus:border-[#57EF40]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1">Estoque Inicial (Un)</label>
                  <input
                    type="number"
                    value={newProdStock}
                    onChange={(e) => setNewProdStock(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-[#111513] border border-[#222924] text-xs text-white font-mono focus:outline-none focus:border-[#57EF40]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1">Alerta Mínimo (Un)</label>
                  <input
                    type="number"
                    value={newProdMinAlert}
                    onChange={(e) => setNewProdMinAlert(parseInt(e.target.value) || 5)}
                    className="w-full px-3 py-2 rounded-xl bg-[#111513] border border-[#222924] text-xs text-white font-mono focus:outline-none focus:border-[#57EF40]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#222924] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewProductOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#18201C] hover:bg-[#202B25] text-xs font-semibold text-white border border-[#222924]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingProduct}
                  className="px-4 py-2 rounded-xl bg-[#57EF40] hover:bg-[#65C556] text-[#070908] font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSubmittingProduct ? 'Salvando...' : 'Salvar Produto'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Movement Modal */}
      {isMovementModalOpen && selectedProductForMovement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-[#0c0f0d] border border-[#222924] rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#222924] flex items-center justify-between bg-[#111513]">
              <div>
                <h3 className="font-bold text-sm text-white">Movimentação de Estoque</h3>
                <p className="text-[11px] text-muted-foreground">{selectedProductForMovement.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsMovementModalOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-white hover:bg-[#18201C]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordMovement} className="p-6 space-y-4">
              <div className="p-3 rounded-xl bg-[#111513] border border-[#222924] flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Estoque Atual:</span>
                <span className="font-mono font-bold text-sm text-white">{selectedProductForMovement.stockQuantity} un</span>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">Tipo de Movimento *</label>
                <select
                  value={movementType}
                  onChange={(e) => setMovementType(e.target.value as StockMovementType)}
                  className="w-full px-3 py-2 rounded-xl bg-[#111513] border border-[#222924] text-xs text-white focus:outline-none focus:border-[#57EF40]"
                >
                  <option value={StockMovementType.ENTRADA}>Entrada (Compra / Reposição)</option>
                  <option value={StockMovementType.SAIDA}>Saída Manual</option>
                  <option value={StockMovementType.AJUSTE}>Ajuste de Balanço / Inventário</option>
                  <option value={StockMovementType.PERDA}>Perda / Avaria</option>
                  <option value={StockMovementType.DEVOLUCAO}>Devolução de Cliente</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">Quantidade *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={movementQty}
                  onChange={(e) => setMovementQty(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 rounded-xl bg-[#111513] border border-[#222924] text-xs text-white font-mono focus:outline-none focus:border-[#57EF40]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">Justificativa / Motivo</label>
                <textarea
                  rows={2}
                  value={movementReason}
                  onChange={(e) => setMovementReason(e.target.value)}
                  placeholder="Ex: Recebimento de lote do fornecedor #4021"
                  className="w-full px-3 py-2 rounded-xl bg-[#111513] border border-[#222924] text-xs text-white focus:outline-none focus:border-[#57EF40] resize-none"
                />
              </div>

              <div className="pt-3 border-t border-[#222924] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsMovementModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#18201C] hover:bg-[#202B25] text-xs font-semibold text-white border border-[#222924]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingMovement}
                  className="px-4 py-2 rounded-xl bg-[#57EF40] hover:bg-[#65C556] text-[#070908] font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <span>{isSubmittingMovement ? 'Lançando...' : 'Confirmar Lançamento'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Movements History Drawer */}
      {isHistoryDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#0c0f0d] border-l border-[#222924] h-full flex flex-col shadow-2xl">
            <div className="px-6 py-4 border-b border-[#222924] flex items-center justify-between bg-[#111513]">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-[#57EF40]" />
                <h3 className="font-bold text-sm text-white">Histórico de Movimentações</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsHistoryDrawerOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-white hover:bg-[#18201C]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {movementsHistory.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  Nenhuma movimentação registrada.
                </div>
              ) : (
                movementsHistory.map(m => {
                  const isPositive = m.type === StockMovementType.IN || (m.type as string) === 'ENTRADA' || (m.type as string) === 'DEVOLUCAO';

                  return (
                    <div
                      key={m.id}
                      className="p-3 rounded-xl bg-[#111513] border border-[#222924] space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-bold flex items-center gap-1 ${
                          isPositive ? 'text-emerald-400' : 'text-amber-400'
                        }`}>
                          {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                          {m.type} ({isPositive ? `+${m.quantity}` : `-${m.quantity}`})
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {new Date(m.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-muted-foreground font-mono text-[11px]">
                        <span>Saldo anterior: {m.previousStock}</span>
                        <span className="text-white font-bold">Novo saldo: {m.newStock}</span>
                      </div>

                      {m.reason && (
                        <p className="text-[11px] text-muted-foreground/80 italic">
                          "{m.reason}"
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
