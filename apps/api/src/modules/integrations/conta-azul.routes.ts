import { FastifyInstance } from 'fastify';
import { contaAzulService } from './conta-azul.service.js';

export async function contaAzulRoutes(app: FastifyInstance) {
  /**
   * GET /api/settings/integrations/conta-azul
   */
  app.get('/conta-azul', async (req, reply) => {
    const workspaceId = (req.headers['x-workspace-id'] as string) || (req.query as any)?.workspaceId || '11111111-1111-1111-1111-111111111111';
    const config = await contaAzulService.getConfig(workspaceId);
    return reply.send({ success: true, data: config });
  });

  /**
   * POST /api/settings/integrations/conta-azul
   */
  app.post('/conta-azul', async (req, reply) => {
    try {
      const workspaceId = (req.headers['x-workspace-id'] as string) || (req.body as any)?.workspaceId || '11111111-1111-1111-1111-111111111111';
      const body = req.body as any;

      const updated = await contaAzulService.updateConfig(workspaceId, body);
      return reply.send({ success: true, data: updated, message: 'Configurações do Conta Azul salvas com sucesso!' });
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  /**
   * POST /api/settings/integrations/conta-azul/test
   */
  app.post('/conta-azul/test', async (req, reply) => {
    const workspaceId = (req.headers['x-workspace-id'] as string) || (req.body as any)?.workspaceId || '11111111-1111-1111-1111-111111111111';
    const result = await contaAzulService.testConnection(workspaceId);
    return reply.send(result);
  });
}
