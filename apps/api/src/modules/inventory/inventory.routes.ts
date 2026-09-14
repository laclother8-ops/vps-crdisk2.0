import { FastifyInstance } from 'fastify';
import { inventoryService } from './inventory.service.js';

export async function inventoryRoutes(app: FastifyInstance) {
  /**
   * GET /api/inventory/products
   */
  app.get('/products', async (req, reply) => {
    const workspaceId = (req.headers['x-workspace-id'] as string) || (req.query as any)?.workspaceId || '11111111-1111-1111-1111-111111111111';
    const search = (req.query as any)?.search;

    const products = await inventoryService.listProducts(workspaceId, search);
    return reply.send({ success: true, data: products, total: products.length });
  });

  /**
   * POST /api/inventory/products
   */
  app.post('/products', async (req, reply) => {
    try {
      const workspaceId = (req.headers['x-workspace-id'] as string) || (req.body as any)?.workspaceId || '11111111-1111-1111-1111-111111111111';
      const body = req.body as any;

      if (!body.name || !body.sku || body.price === undefined) {
        return reply.status(400).send({ error: 'Nome, SKU e Preço são obrigatórios.' });
      }

      const product = await inventoryService.createProduct(workspaceId, body);
      return reply.status(201).send({ success: true, data: product });
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  /**
   * GET /api/inventory/movements
   */
  app.get('/movements', async (req, reply) => {
    const workspaceId = (req.headers['x-workspace-id'] as string) || (req.query as any)?.workspaceId || '11111111-1111-1111-1111-111111111111';
    const productId = (req.query as any)?.productId;

    const movements = await inventoryService.listMovements(workspaceId, productId);
    return reply.send({ success: true, data: movements, total: movements.length });
  });

  /**
   * POST /api/inventory/movements
   * Entrada / Saída / Ajuste manual de mercadoria com justificativa
   */
  app.post('/movements', async (req, reply) => {
    try {
      const workspaceId = (req.headers['x-workspace-id'] as string) || (req.body as any)?.workspaceId || '11111111-1111-1111-1111-111111111111';
      const body = req.body as any;

      if (!body.productId || !body.type || body.quantity === undefined || !body.reason) {
        return reply.status(400).send({ error: 'Produto, tipo (IN/OUT/ADJUSTMENT), quantidade e motivo são obrigatórios.' });
      }

      const movement = await inventoryService.recordStockMovement(workspaceId, body);
      return reply.status(201).send({ success: true, data: movement });
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });
}
