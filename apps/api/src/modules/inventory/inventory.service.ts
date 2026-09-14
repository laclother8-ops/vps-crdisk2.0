import { Product, StockMovement, StockMovementType, WSEventType } from '@omnicrm/shared';
import { WebSocketGateway } from '../../websocket/ws.gateway.js';

export interface CreateProductInput {
  name: string;
  sku: string;
  category?: string;
  price: number;
  costPrice?: number;
  stockQuantity?: number;
  minStockAlert?: number;
  contaAzulProductId?: string | null;
}

export interface StockMovementInput {
  productId: string;
  type: StockMovementType;
  quantity: number;
  reason: string;
  orderId?: string | null;
}

class InventoryRepository {
  private products: Product[] = [
    {
      id: 'prod-001',
      workspaceId: '11111111-1111-1111-1111-111111111111',
      name: 'Headset Profissional VoIP Noise-Cancelling USB',
      sku: 'HDST-PRO-01',
      category: 'Equipamentos',
      price: 289.90,
      costPrice: 145.00,
      stockQuantity: 42,
      minStockAlert: 10,
      isActive: true,
      contaAzulProductId: 'ca_prod_001',
      createdAt: new Date('2026-01-10T00:00:00Z'),
      updatedAt: new Date()
    },
    {
      id: 'prod-002',
      workspaceId: '11111111-1111-1111-1111-111111111111',
      name: 'Licença Adicional Operador Power Dialer (Mensal)',
      sku: 'LIC-DIAL-OP',
      category: 'Software & SaaS',
      price: 120.00,
      costPrice: 25.00,
      stockQuantity: 999,
      minStockAlert: 20,
      isActive: true,
      contaAzulProductId: 'ca_prod_002',
      createdAt: new Date('2026-01-12T00:00:00Z'),
      updatedAt: new Date()
    },
    {
      id: 'prod-003',
      workspaceId: '11111111-1111-1111-1111-111111111111',
      name: 'Pacote de 10.000 Minutos Telefonia VoIP SIP Nacional',
      sku: 'VOIP-PAC-10K',
      category: 'Telefonia',
      price: 490.00,
      costPrice: 220.00,
      stockQuantity: 15,
      minStockAlert: 5,
      isActive: true,
      contaAzulProductId: 'ca_prod_003',
      createdAt: new Date('2026-01-15T00:00:00Z'),
      updatedAt: new Date()
    },
    {
      id: 'prod-004',
      workspaceId: '11111111-1111-1111-1111-111111111111',
      name: 'Setup & Onboarding de Agente Sofia IA com Base RAG',
      sku: 'SRV-ONB-SOFIA',
      category: 'Serviços de IA',
      price: 1500.00,
      costPrice: 400.00,
      stockQuantity: 4,
      minStockAlert: 5, // Alerta visual ativado
      isActive: true,
      contaAzulProductId: 'ca_prod_004',
      createdAt: new Date('2026-02-01T00:00:00Z'),
      updatedAt: new Date()
    },
    {
      id: 'prod-005',
      workspaceId: '11111111-1111-1111-1111-111111111111',
      name: 'Gateway Adaptador ATA FXS 2 Portas Cisco / Grandstream',
      sku: 'EQP-ATA-2P',
      category: 'Equipamentos',
      price: 349.00,
      costPrice: 195.00,
      stockQuantity: 2, // Alerta crítico (estoque baixo)
      minStockAlert: 8,
      isActive: true,
      contaAzulProductId: 'ca_prod_005',
      createdAt: new Date('2026-02-05T00:00:00Z'),
      updatedAt: new Date()
    }
  ];

  private movements: StockMovement[] = [
    {
      id: 'mov-001',
      workspaceId: '11111111-1111-1111-1111-111111111111',
      productId: 'prod-001',
      productName: 'Headset Profissional VoIP Noise-Cancelling USB',
      productSku: 'HDST-PRO-01',
      type: StockMovementType.IN,
      quantity: 50,
      reason: 'Entrada de lote fornecedor nacional',
      createdAt: new Date('2026-02-10T10:00:00Z')
    },
    {
      id: 'mov-002',
      workspaceId: '11111111-1111-1111-1111-111111111111',
      productId: 'prod-001',
      productName: 'Headset Profissional VoIP Noise-Cancelling USB',
      productSku: 'HDST-PRO-01',
      type: StockMovementType.OUT,
      quantity: 8,
      reason: 'Pedido ORD-2026-001 faturado',
      orderId: 'ord-001',
      createdAt: new Date('2026-02-14T14:30:00Z')
    }
  ];

  private calculateMargin(price: number, costPrice: number): number {
    if (price <= 0) return 0;
    return Number((((price - costPrice) / price) * 100).toFixed(1));
  }

  async listProducts(workspaceId: string, search?: string): Promise<Product[]> {
    let list = this.products.filter(p => p.workspaceId === workspaceId || workspaceId === '11111111-1111-1111-1111-111111111111');

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    }

    return list.map(p => ({
      ...p,
      profitMargin: this.calculateMargin(p.price, p.costPrice)
    }));
  }

  async getProductById(id: string): Promise<Product | undefined> {
    const prod = this.products.find(p => p.id === id);
    if (!prod) return undefined;
    return {
      ...prod,
      profitMargin: this.calculateMargin(prod.price, prod.costPrice)
    };
  }

  async createProduct(workspaceId: string, input: CreateProductInput): Promise<Product> {
    const existing = this.products.find(p => p.workspaceId === workspaceId && p.sku.toLowerCase() === input.sku.toLowerCase());
    if (existing) {
      throw new Error(`SKU "${input.sku}" já cadastrado neste workspace.`);
    }

    const newProduct: Product = {
      id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      workspaceId,
      name: input.name,
      sku: input.sku.toUpperCase(),
      category: input.category || 'Geral',
      price: Number(input.price),
      costPrice: Number(input.costPrice || 0),
      stockQuantity: Number(input.stockQuantity || 0),
      minStockAlert: Number(input.minStockAlert || 5),
      isActive: true,
      contaAzulProductId: input.contaAzulProductId || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.products.unshift(newProduct);

    // Initial stock movement if stock > 0
    if (newProduct.stockQuantity > 0) {
      this.movements.unshift({
        id: `mov-${Date.now()}`,
        workspaceId,
        productId: newProduct.id,
        productName: newProduct.name,
        productSku: newProduct.sku,
        type: StockMovementType.IN,
        quantity: newProduct.stockQuantity,
        reason: 'Saldo inicial de implantação',
        createdAt: new Date()
      });
    }

    return {
      ...newProduct,
      profitMargin: this.calculateMargin(newProduct.price, newProduct.costPrice)
    };
  }

  async recordStockMovement(workspaceId: string, input: StockMovementInput): Promise<StockMovement> {
    const product = this.products.find(p => p.id === input.productId);
    if (!product) {
      throw new Error('Produto não encontrado para movimentação de estoque.');
    }

    const qty = Math.abs(Number(input.quantity));

    if (input.type === StockMovementType.OUT) {
      if (product.stockQuantity < qty) {
        throw new Error(`Estoque insuficiente! Saldo disponível: ${product.stockQuantity}, Solicitado: ${qty}`);
      }
      product.stockQuantity -= qty;
    } else if (input.type === StockMovementType.IN) {
      product.stockQuantity += qty;
    } else if (input.type === StockMovementType.ADJUSTMENT) {
      product.stockQuantity = qty;
    }

    product.updatedAt = new Date();

    const movement: StockMovement = {
      id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      workspaceId,
      productId: product.id,
      productName: product.name,
      productSku: product.sku,
      type: input.type,
      quantity: qty,
      reason: input.reason,
      orderId: input.orderId || null,
      createdAt: new Date()
    };

    this.movements.unshift(movement);

    // Realtime broadcast of updated stock
    WebSocketGateway.getInstance().broadcast(
      WSEventType.STOCK_UPDATED,
      {
        workspaceId,
        productId: product.id,
        newStock: product.stockQuantity,
        type: input.type,
        sku: product.sku
      },
      workspaceId
    );

    return movement;
  }

  async listMovements(workspaceId: string, productId?: string): Promise<StockMovement[]> {
    let list = this.movements.filter(m => m.workspaceId === workspaceId || workspaceId === '11111111-1111-1111-1111-111111111111');
    if (productId) {
      list = list.filter(m => m.productId === productId);
    }
    return list;
  }
}

export const inventoryService = new InventoryRepository();
