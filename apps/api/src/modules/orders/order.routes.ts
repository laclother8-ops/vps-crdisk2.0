import { FastifyInstance } from 'fastify';
import { orderService } from './order.service.js';
import { OrderStatus } from '@omnicrm/shared';

export async function orderRoutes(app: FastifyInstance) {
  /**
   * GET /api/orders
   * List orders with optional status or search query
   */
  app.get('/', async (req, reply) => {
    const workspaceId = (req.headers['x-workspace-id'] as string) || (req.query as any)?.workspaceId || '11111111-1111-1111-1111-111111111111';
    const status = (req.query as any)?.status as OrderStatus;
    const search = (req.query as any)?.search;

    const orders = await orderService.listOrders(workspaceId, { status, search });
    return reply.send({ success: true, data: orders, total: orders.length });
  });

  /**
   * GET /api/orders/:id
   */
  app.get('/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const order = await orderService.getOrderById(id);
    if (!order) {
      return reply.status(404).send({ error: 'Pedido não encontrado.' });
    }
    return reply.send({ success: true, data: order });
  });

  /**
   * POST /api/orders
   * Fast Order PDV Creation
   */
  app.post('/', async (req, reply) => {
    try {
      const workspaceId = (req.headers['x-workspace-id'] as string) || (req.body as any)?.workspaceId || '11111111-1111-1111-1111-111111111111';
      const body = req.body as any;

      if (!body.contactId || !body.items || !Array.isArray(body.items) || body.items.length === 0) {
        return reply.status(400).send({ error: 'Contato e ao menos 1 item são obrigatórios.' });
      }

      const order = await orderService.createOrder({
        workspaceId,
        contactId: body.contactId,
        paymentMethod: body.paymentMethod || 'Pix',
        deliveryDate: body.deliveryDate,
        discountAmount: body.discountAmount || 0,
        notes: body.notes,
        items: body.items
      });

      return reply.status(201).send({ success: true, data: order });
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  /**
   * PATCH /api/orders/:id/status
   * Move order through the 8-stage Kanban
   */
  app.patch('/:id/status', async (req, reply) => {
    try {
      const { id } = req.params as { id: string };
      const { status } = req.body as { status: OrderStatus };

      if (!status) {
        return reply.status(400).send({ error: 'Status é obrigatório.' });
      }

      const updated = await orderService.updateOrderStatus(id, status);
      return reply.send({ success: true, data: updated });
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  /**
   * PATCH /api/orders/:id/delivery-date
   * Update delivery date via calendar drag-and-drop
   */
  app.patch('/:id/delivery-date', async (req, reply) => {
    try {
      const { id } = req.params as { id: string };
      const { deliveryDate } = req.body as { deliveryDate: string | null };

      const updated = await orderService.updateDeliveryDate(id, deliveryDate);
      return reply.send({ success: true, data: updated });
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  /**
   * POST /api/orders/:id/sync-conta-azul
   * Manual trigger to force Conta Azul sync
   */
  app.post('/:id/sync-conta-azul', async (req, reply) => {
    try {
      const { id } = req.params as { id: string };
      const result = await orderService.forceSyncContaAzul(id);
      return reply.send(result);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });
}
