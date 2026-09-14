export enum OrderStatus {
  DRAFT = 'DRAFT',                         // Rascunho / Orçamento
  ORCAMENTO = 'DRAFT',
  AWAITING_PAYMENT = 'AWAITING_PAYMENT',   // Aguardando Pagamento / Aprovado
  APROVADO = 'AWAITING_PAYMENT',
  PAID = 'PAID',                           // Pagamento Confirmado
  IN_PRODUCTION = 'IN_PRODUCTION',         // Separação de Estoque / Produção
  EM_SEPARACAO = 'IN_PRODUCTION',
  PRODUCAO = 'IN_PRODUCTION',
  COMPLETED = 'COMPLETED',                 // Concluído / Faturado
  FATURADO = 'COMPLETED',
  DISPATCHED = 'DISPATCHED',               // Em Expedição / Em Rota
  EM_ROTA = 'DISPATCHED',
  DELIVERED = 'DELIVERED',                 // Entregue / A Receber
  ENTREGUE = 'DELIVERED',
  CANCELED = 'CANCELED',                   // Cancelado / Estorno
  CANCELADO = 'CANCELED'
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  [OrderStatus.DRAFT]: 'Orçamento / Rascunho',
  [OrderStatus.AWAITING_PAYMENT]: 'Pedido Aprovado',
  [OrderStatus.IN_PRODUCTION]: 'Separação & Produção',
  [OrderStatus.PAID]: 'Pagamento Confirmado',
  [OrderStatus.COMPLETED]: 'Faturado / Concluído',
  [OrderStatus.DISPATCHED]: 'Em Rota / Expedição',
  [OrderStatus.DELIVERED]: 'Entregue',
  [OrderStatus.CANCELED]: 'Cancelado'
};

export const ORDER_STATUS_ORDER: OrderStatus[] = [
  OrderStatus.DRAFT,
  OrderStatus.AWAITING_PAYMENT,
  OrderStatus.IN_PRODUCTION,
  OrderStatus.DISPATCHED,
  OrderStatus.COMPLETED,
  OrderStatus.DELIVERED,
  OrderStatus.CANCELED
];

export enum StockMovementType {
  IN = 'IN',
  ENTRADA = 'IN',
  OUT = 'OUT',
  SAIDA = 'OUT',
  ADJUSTMENT = 'ADJUSTMENT',
  AJUSTE = 'ADJUSTMENT',
  PERDA = 'OUT',
  DEVOLUCAO = 'IN'
}

export interface Product {
  id: string;
  workspaceId: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  costPrice: number;
  stockQuantity: number;
  minStockAlert: number;
  isActive: boolean;
  contaAzulProductId?: string | null;
  profitMargin?: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface OrderItem {
  id?: string;
  orderId?: string;
  productId: string;
  productName?: string;
  productSku?: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  totalItemPrice?: number;
  totalPrice?: number;
}

export interface Order {
  id: string;
  workspaceId: string;
  contactId: string;
  contactName?: string;
  contactCompany?: string | null;
  contactPhone?: string;
  contactEmail?: string | null;
  lead?: {
    id: string;
    name: string;
    company?: string | null;
    phone?: string;
    email?: string | null;
  };
  orderNumber: string;
  code?: string;
  totalAmount: number;
  discountAmount?: number;
  discount?: number;
  freight?: number;
  paymentMethod?: string;
  status: OrderStatus;
  contaAzulSaleId?: string | null;
  contaAzulSyncStatus?: 'PENDING' | 'SYNCED' | 'FAILED' | string;
  deliveryDate?: string | null;
  notes?: string | null;
  itemsCount?: number;
  items?: OrderItem[];
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface StockMovement {
  id: string;
  workspaceId: string;
  productId: string;
  productName?: string;
  productSku?: string;
  type: StockMovementType;
  quantity: number;
  previousStock?: number;
  newStock?: number;
  reason: string;
  orderId?: string | null;
  createdAt: string | Date;
}

export type ChurnRiskTier = 'NORMAL' | 'ALERT' | 'CRITICAL';

export interface CustomerRecurrence {
  id: string;
  name: string;
  company?: string | null;
  phone: string;
  email?: string | null;
  lastOrderAt?: string | null;
  totalOrdersCount: number;
  ltv: number;
  inactivityDays: number;
  daysSinceLastOrder?: number;
  riskTier: ChurnRiskTier;
  churnTier?: ChurnRiskTier;
  lastOrderNumber?: string | null;
  lastOrderAmount?: number | null;
}

export interface CreateOrderInput {
  workspaceId: string;
  contactId: string;
  paymentMethod: string;
  deliveryDate?: string | null;
  discountAmount?: number;
  notes?: string | null;
  items: {
    productId: string;
    quantity: number;
    unitPrice?: number;
  }[];
}

export interface ContaAzulConfig {
  clientId?: string | null;
  clientSecret?: string | null;
  accessToken?: string | null;
  refreshToken?: string | null;
  expiresAt?: string | null;
  enabled: boolean;
}
