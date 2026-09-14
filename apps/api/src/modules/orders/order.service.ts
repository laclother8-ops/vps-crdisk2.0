import { CreateOrderInput, Order, OrderItem, OrderStatus, ORDER_STATUS_ORDER, StockMovementType, WSEventType } from '@omnicrm/shared';
import { inventoryService } from '../inventory/inventory.service.js';
import { contaAzulService } from '../integrations/conta-azul.service.js';
import { crmService } from '../crm/crm.service.js';
import { WebSocketGateway } from '../../websocket/ws.gateway.js';

class OrderRepository {
  private orders: Order[] = [
    {
      id: 'ord-101',
      workspaceId: '11111111-1111-1111-1111-111111111111',
      contactId: '1',
      contactName: 'Carlos Silva (TechCorp)',
      contactCompany: 'TechCorp Inovação',
      contactPhone: '+55 11 98888-1001',
      contactEmail: 'carlos@techcorp.com.br',
      orderNumber: 'ORD-2026-001',
      totalAmount: 1450.00,
      discountAmount: 50.00,
      paymentMethod: 'Pix',
      status: OrderStatus.DRAFT,
      contaAzulSaleId: null,
      deliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      notes: 'Cliente solicitou faturamento direto via Pix.',
      itemsCount: 2,
      items: [
        {
          id: 'item-1',
          orderId: 'ord-101',
          productId: 'prod-001',
          productName: 'Headset Profissional VoIP USB',
          productSku: 'HDST-PRO-01',
          quantity: 2,
          unitPrice: 289.90,
          totalItemPrice: 579.80
        },
        {
          id: 'item-2',
          orderId: 'ord-101',
          productId: 'prod-003',
          productName: 'Pacote de 10.000 Minutos VoIP',
          productSku: 'VOIP-PAC-10K',
          quantity: 2,
          unitPrice: 490.00,
          totalItemPrice: 980.00
        }
      ],
      createdAt: new Date('2026-03-01T10:00:00Z'),
      updatedAt: new Date()
    },
    {
      id: 'ord-102',
      workspaceId: '11111111-1111-1111-1111-111111111111',
      contactId: '2',
      contactName: 'Mariana Costa',
      contactCompany: 'Nexus Logística',
      contactPhone: '+55 11 98888-1002',
      contactEmail: 'mariana@nexus.com.br',
      orderNumber: 'ORD-2026-002',
      totalAmount: 2380.00,
      discountAmount: 100.00,
      paymentMethod: 'Boleto',
      status: OrderStatus.AWAITING_PAYMENT,
      contaAzulSaleId: null,
      deliveryDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      notes: 'Aguardando compensação bancária do boleto.',
      itemsCount: 1,
      items: [
        {
          id: 'item-3',
          orderId: 'ord-102',
          productId: 'prod-002',
          productName: 'Licença Adicional Power Dialer',
          productSku: 'LIC-DIAL-OP',
          quantity: 20,
          unitPrice: 120.00,
          totalItemPrice: 2400.00
        }
      ],
      createdAt: new Date('2026-03-02T14:20:00Z'),
      updatedAt: new Date()
    },
    {
      id: 'ord-103',
      workspaceId: '11111111-1111-1111-1111-111111111111',
      contactId: '3',
      contactName: 'Roberto Almeida',
      contactCompany: 'Almeida Seguros',
      contactPhone: '+55 11 98888-1003',
      contactEmail: 'roberto@almeidavendas.com.br',
      orderNumber: 'ORD-2026-003',
      totalAmount: 1500.00,
      discountAmount: 0.00,
      paymentMethod: 'Cartão de Crédito',
      status: OrderStatus.PAID,
      contaAzulSaleId: 'ca_sale_20260303_003',
      deliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      notes: 'Pagamento aprovado instantaneamente via gateway.',
      itemsCount: 1,
      items: [
        {
          id: 'item-4',
          orderId: 'ord-103',
          productId: 'prod-004',
          productName: 'Setup & Onboarding Sofia IA RAG',
          productSku: 'SRV-ONB-SOFIA',
          quantity: 1,
          unitPrice: 1500.00,
          totalItemPrice: 1500.00
        }
      ],
      createdAt: new Date('2026-03-03T09:15:00Z'),
      updatedAt: new Date()
    },
    {
      id: 'ord-104',
      workspaceId: '11111111-1111-1111-1111-111111111111',
      contactId: '4',
      contactName: 'Juliana Mendes',
      contactCompany: 'Clínica Saúde Total',
      contactPhone: '+55 11 98888-1004',
      contactEmail: 'juliana@clinicasaude.med.br',
      orderNumber: 'ORD-2026-004',
      totalAmount: 698.00,
      discountAmount: 0.00,
      paymentMethod: 'Pix',
      status: OrderStatus.IN_PRODUCTION,
      contaAzulSaleId: 'ca_sale_20260304_004',
      deliveryDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Atrasado (alerta vermelho)
      notes: 'Hardware em processo de separação física na expedição.',
      itemsCount: 2,
      items: [
        {
          id: 'item-5',
          orderId: 'ord-104',
          productId: 'prod-005',
          productName: 'Gateway Adaptador ATA FXS 2 Portas',
          productSku: 'EQP-ATA-2P',
          quantity: 2,
          unitPrice: 349.00,
          totalItemPrice: 698.00
        }
      ],
      createdAt: new Date('2026-03-04T11:45:00Z'),
      updatedAt: new Date()
    },
    {
      id: 'ord-105',
      workspaceId: '11111111-1111-1111-1111-111111111111',
      contactId: '5',
      contactName: 'Fernando Rocha',
      contactCompany: 'Rocha Distribuidora',
      contactPhone: '+55 11 98888-1005',
      contactEmail: 'fernando@rochadistrib.com.br',
      orderNumber: 'ORD-2026-005',
      totalAmount: 3120.00,
      discountAmount: 150.00,
      paymentMethod: 'Faturado',
      status: OrderStatus.DISPATCHED,
      contaAzulSaleId: 'ca_sale_20260305_005',
      deliveryDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      notes: 'Código de rastreio transportadora: LOG-BR-889128',
      itemsCount: 3,
      createdAt: new Date('2026-03-05T16:00:00Z'),
      updatedAt: new Date()
    },
    {
      id: 'ord-106',
      workspaceId: '11111111-1111-1111-1111-111111111111',
      contactId: '6',
      contactName: 'Luciana Ferreira',
      contactCompany: 'Prime Consultoria',
      contactPhone: '+55 11 98888-1006',
      contactEmail: 'luciana@primeconsult.com.br',
      orderNumber: 'ORD-2026-006',
      totalAmount: 1850.00,
      discountAmount: 0.00,
      paymentMethod: 'Pix',
      status: OrderStatus.DELIVERED,
      contaAzulSaleId: 'ca_sale_20260306_006',
      deliveryDate: new Date(Date.now()).toISOString(),
      notes: 'Mercadoria entregue com comprovante assinado.',
      itemsCount: 2,
      createdAt: new Date('2026-03-06T10:30:00Z'),
      updatedAt: new Date()
    },
    {
      id: 'ord-107',
      workspaceId: '11111111-1111-1111-1111-111111111111',
      contactId: '1',
      contactName: 'Carlos Silva (TechCorp)',
      contactCompany: 'TechCorp Inovação',
      contactPhone: '+55 11 98888-1001',
      contactEmail: 'carlos@techcorp.com.br',
      orderNumber: 'ORD-2026-007',
      totalAmount: 4900.00,
      discountAmount: 200.00,
      paymentMethod: 'Boleto',
      status: OrderStatus.COMPLETED,
      contaAzulSaleId: 'ca_sale_20260307_007',
      deliveryDate: new Date('2026-02-28T00:00:00Z').toISOString(),
      notes: 'Nota Fiscal emitida e faturada via Conta Azul.',
      itemsCount: 4,
      createdAt: new Date('2026-02-25T08:00:00Z'),
      updatedAt: new Date()
    },
    {
      id: 'ord-108',
      workspaceId: '11111111-1111-1111-1111-111111111111',
      contactId: '2',
      contactName: 'Mariana Costa',
      contactCompany: 'Nexus Logística',
      contactPhone: '+55 11 98888-1002',
      contactEmail: 'mariana@nexus.com.br',
      orderNumber: 'ORD-2026-008',
      totalAmount: 890.00,
      discountAmount: 0.00,
      paymentMethod: 'Cartão de Crédito',
      status: OrderStatus.CANCELED,
      contaAzulSaleId: null,
      deliveryDate: null,
      notes: 'Cancelamento solicitado pelo cliente antes do faturamento.',
      itemsCount: 1,
      createdAt: new Date('2026-02-20T17:10:00Z'),
      updatedAt: new Date()
    }
  ];

  async listOrders(workspaceId: string, filters?: { status?: OrderStatus; search?: string }): Promise<Order[]> {
    let list = this.orders.filter(o => o.workspaceId === workspaceId || workspaceId === '11111111-1111-1111-1111-111111111111');

    if (filters?.status) {
      list = list.filter(o => o.status === filters.status);
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(o => 
        o.orderNumber.toLowerCase().includes(q) ||
        (o.contactName && o.contactName.toLowerCase().includes(q)) ||
        (o.contactCompany && o.contactCompany.toLowerCase().includes(q))
      );
    }

    return list;
  }

  async getOrderById(id: string): Promise<Order | undefined> {
    return this.orders.find(o => o.id === id);
  }

  /**
   * Emissão rápida de pedido (PDV) com baixa automática de estoque
   */
  async createOrder(input: CreateOrderInput): Promise<Order> {
    const { workspaceId, contactId, paymentMethod, deliveryDate, discountAmount = 0, notes, items } = input;

    if (!items || items.length === 0) {
      throw new Error('O pedido deve conter pelo menos 1 item.');
    }

    // Lookup contact details from CRM
    const contact = await crmService.getLeadById(contactId);
    const contactName = contact?.name || 'Cliente Geral';
    const contactCompany = contact?.company || null;
    const contactPhone = contact?.phone || '';
    const contactEmail = contact?.email || null;

    const orderNumber = `ORD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    let subtotal = 0;
    const processedItems: OrderItem[] = [];

    // 1. Validate & process items, calculating totals
    for (const itm of items) {
      const product = await inventoryService.getProductById(itm.productId);
      if (!product) {
        throw new Error(`Produto "${itm.productId}" não encontrado.`);
      }

      const qty = Math.max(1, Number(itm.quantity));
      const unitPrice = itm.unitPrice !== undefined ? Number(itm.unitPrice) : Number(product.price);
      const totalItemPrice = Number((qty * unitPrice).toFixed(2));
      subtotal += totalItemPrice;

      processedItems.push({
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        orderId: '',
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        quantity: qty,
        unitPrice,
        totalItemPrice
      });
    }

    const finalTotal = Math.max(0, Number((subtotal - Number(discountAmount)).toFixed(2)));

    const newOrder: Order = {
      id: `ord-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      workspaceId,
      contactId,
      contactName,
      contactCompany,
      contactPhone,
      contactEmail,
      orderNumber,
      totalAmount: finalTotal,
      discountAmount: Number(discountAmount),
      paymentMethod,
      status: OrderStatus.DRAFT,
      contaAzulSaleId: null,
      deliveryDate: deliveryDate || null,
      notes: notes || null,
      itemsCount: processedItems.length,
      items: processedItems,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Assign back orderId to items
    for (const item of newOrder.items || []) {
      item.orderId = newOrder.id;
    }

    // 2. Baixa automática no estoque para cada produto físico
    for (const itm of processedItems) {
      try {
        await inventoryService.recordStockMovement(workspaceId, {
          productId: itm.productId,
          type: StockMovementType.OUT,
          quantity: itm.quantity,
          reason: `Baixa automática Pedido ${orderNumber}`,
          orderId: newOrder.id
        });
      } catch (err: any) {
        console.warn(`[Order Stock Warning] ${err.message}`);
      }
    }

    // 3. Atualizar inteligência de recorrência do contato/lead
    if (contact) {
      const currentOrders = (contact as any).totalOrdersCount || 0;
      const currentLtv = (contact as any).ltv || 0;
      await crmService.updateLead(contact.id, {
        lastOrderAt: new Date().toISOString(),
        totalOrdersCount: currentOrders + 1,
        ltv: Number((Number(currentLtv) + finalTotal).toFixed(2))
      } as any);
    }

    this.orders.unshift(newOrder);

    // 4. WebSocket Broadcast
    WebSocketGateway.getInstance().broadcast(
      WSEventType.ORDER_CREATED,
      newOrder,
      workspaceId
    );

    return newOrder;
  }

  /**
   * Atualização de status Kanban (com gatilho Conta Azul e transições)
   */
  async updateOrderStatus(orderId: string, newStatus: OrderStatus): Promise<Order> {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) {
      throw new Error('Pedido não encontrado.');
    }

    const previousStatus = order.status;
    order.status = newStatus;
    order.updatedAt = new Date();

    // Trigger Conta Azul sync automatically when moving to PAID or COMPLETED if not synced yet
    if ((newStatus === OrderStatus.PAID || newStatus === OrderStatus.COMPLETED) && !order.contaAzulSaleId) {
      try {
        const syncResult = await contaAzulService.syncSaleOrder(order.workspaceId, {
          customerId: order.contactId,
          orderNumber: order.orderNumber,
          emissionDate: new Date().toISOString(),
          items: (order.items || []).map(i => ({
            description: i.productName || 'Produto de Venda',
            quantity: i.quantity,
            value: i.unitPrice
          })),
          totalAmount: order.totalAmount,
          discountAmount: order.discountAmount,
          paymentMethod: order.paymentMethod || 'Pix',
          dueDate: order.deliveryDate || new Date().toISOString()
        });

        if (syncResult.saleId) {
          order.contaAzulSaleId = syncResult.saleId;
        }
      } catch (caErr) {
        console.error('[Conta Azul Trigger Error]', caErr);
      }
    }

    WebSocketGateway.getInstance().broadcast(
      WSEventType.ORDER_STATUS_CHANGED,
      {
        orderId: order.id,
        orderNumber: order.orderNumber,
        previousStatus,
        newStatus,
        contaAzulSaleId: order.contaAzulSaleId
      },
      order.workspaceId
    );

    return order;
  }

  /**
   * Atualização da data de entrega prevista (Calendário de Entregas)
   */
  async updateDeliveryDate(orderId: string, newDeliveryDate: string | null): Promise<Order> {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) {
      throw new Error('Pedido não encontrado.');
    }

    order.deliveryDate = newDeliveryDate;
    order.updatedAt = new Date();

    WebSocketGateway.getInstance().broadcast(
      WSEventType.ORDER_STATUS_CHANGED,
      {
        orderId: order.id,
        orderNumber: order.orderNumber,
        deliveryDate: newDeliveryDate
      },
      order.workspaceId
    );

    return order;
  }

  /**
   * Força sincronização manual com o Conta Azul
   */
  async forceSyncContaAzul(orderId: string): Promise<{ success: boolean; saleId: string; message: string }> {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) {
      throw new Error('Pedido não encontrado.');
    }

    const syncResult = await contaAzulService.syncSaleOrder(order.workspaceId, {
      customerId: order.contactId,
      orderNumber: order.orderNumber,
      emissionDate: new Date().toISOString(),
      items: (order.items || []).map(i => ({
        description: i.productName || 'Produto',
        quantity: i.quantity,
        value: i.unitPrice
      })),
      totalAmount: order.totalAmount,
      discountAmount: order.discountAmount,
      paymentMethod: order.paymentMethod || 'Pix',
      dueDate: order.deliveryDate || new Date().toISOString()
    });

    if (syncResult.saleId) {
      order.contaAzulSaleId = syncResult.saleId;
      order.updatedAt = new Date();
    }

    return {
      success: Boolean(syncResult.saleId),
      saleId: syncResult.saleId || '',
      message: syncResult.saleId 
        ? `Pedido sincronizado com sucesso no Conta Azul (Venda ID: ${syncResult.saleId})` 
        : 'A integração com o Conta Azul está desativada nas configurações.'
    };
  }
}

export const orderService = new OrderRepository();
