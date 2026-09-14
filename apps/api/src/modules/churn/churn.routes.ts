import { FastifyInstance } from 'fastify';
import { churnService } from './churn.service.js';
import { ChurnRiskTier } from '@omnicrm/shared';

export async function churnRoutes(app: FastifyInstance) {
  /**
   * GET /api/churn/alerts
   * Recurrence and Churn Risk intelligence per customer
   */
  app.get('/alerts', async (req, reply) => {
    const workspaceId = (req.headers['x-workspace-id'] as string) || (req.query as any)?.workspaceId || '11111111-1111-1111-1111-111111111111';
    const riskTier = (req.query as any)?.riskTier as ChurnRiskTier | undefined;

    const data = await churnService.getCustomerRecurrenceList(workspaceId, riskTier);
    return reply.send({ success: true, ...data });
  });

  /**
   * POST /api/churn/reactivation-prompt
   * Generate AI reactivation copy for customer
   */
  app.post('/reactivation-prompt', async (req, reply) => {
    const { customer } = req.body as any;
    if (!customer) {
      return reply.status(400).send({ error: 'Dados do cliente são obrigatórios.' });
    }

    const message = churnService.generateReactivationPrompt(customer);
    return reply.send({ success: true, message });
  });
}
