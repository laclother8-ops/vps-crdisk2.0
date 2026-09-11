import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { workspaceService } from './workspace.service';
import { authenticate, requireRole } from '../auth/rbac.middleware';
import { CreateWorkspaceSchema } from '@omnicrm/shared';

export const workspaceRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // All admin workspace routes require authentication and SUPERADMIN role
  fastify.addHook('preHandler', authenticate);
  fastify.addHook('preHandler', requireRole('superadmin'));

  /**
   * GET /api/admin/workspaces
   * List all workspaces with pagination and optional search filter
   */
  fastify.get('/', async (request, reply) => {
    try {
      const query = request.query as { page?: string; limit?: string; search?: string; status?: string };
      const page = Math.max(1, parseInt(query.page || '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)));
      const search = query.search;
      const status = query.status;

      const result = await workspaceService.listWorkspaces({ page, limit, search, status });
      return reply.send(result);
    } catch (err: any) {
      request.log.error({ err }, 'Error listing workspaces');
      return reply.status(500).send({ error: 'Erro ao listar workspaces', details: err.message });
    }
  });

  /**
   * GET /api/admin/workspaces/metrics
   * Global platform statistics for Super Admin dashboard
   */
  fastify.get('/metrics', async (request, reply) => {
    try {
      const metrics = await workspaceService.getGlobalMetrics();
      return reply.send(metrics);
    } catch (err: any) {
      request.log.error({ err }, 'Error getting global metrics');
      return reply.status(500).send({ error: 'Erro ao obter métricas da plataforma', details: err.message });
    }
  });

  /**
   * GET /api/admin/workspaces/:id
   * Get single workspace details
   */
  fastify.get('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const workspace = await workspaceService.getWorkspaceById(id);
      if (!workspace) {
        return reply.status(404).send({ error: 'Workspace não encontrado' });
      }
      return reply.send(workspace);
    } catch (err: any) {
      request.log.error({ err }, 'Error getting workspace');
      return reply.status(500).send({ error: 'Erro ao buscar workspace', details: err.message });
    }
  });

  /**
   * POST /api/admin/workspaces
   * Create a new tenant workspace along with its initial workspace_admin user
   */
  fastify.post('/', async (request, reply) => {
    try {
      const parseResult = CreateWorkspaceSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: 'Dados de workspace inválidos',
          issues: parseResult.error.format()
        });
      }

      const newWorkspace = await workspaceService.createWorkspace(parseResult.data);
      return reply.status(201).send(newWorkspace);
    } catch (err: any) {
      request.log.error({ err }, 'Error creating workspace');
      return reply.status(400).send({ error: err.message || 'Erro ao criar workspace' });
    }
  });

  /**
   * PATCH /api/admin/workspaces/:id/status
   * Toggle workspace status (active / suspended)
   */
  fastify.patch('/:id/status', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const body = request.body as { status: 'active' | 'suspended' };

      if (!body.status || !['active', 'suspended'].includes(body.status)) {
        return reply.status(400).send({ error: "Status inválido. Use 'active' ou 'suspended'." });
      }

      const updated = await workspaceService.updateWorkspaceStatus(id, body.status);
      if (!updated) {
        return reply.status(404).send({ error: 'Workspace não encontrado' });
      }

      return reply.send({ success: true, workspace: updated });
    } catch (err: any) {
      request.log.error({ err }, 'Error updating workspace status');
      return reply.status(500).send({ error: 'Erro ao atualizar status do workspace', details: err.message });
    }
  });

  /**
   * PATCH /api/admin/workspaces/:id/subscription
   * Update subscription status, plan, trial ends date, or current period end for a workspace (1-Click Superadmin Override)
   */
  fastify.patch('/:id/subscription', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const body = request.body as {
        subscriptionStatus?: 'trial' | 'active' | 'past_due' | 'canceled' | 'pending_payment';
        subscriptionPlan?: 'starter' | 'pro' | 'enterprise';
        trialEndsAt?: string | null;
        currentPeriodEnd?: string | null;
        paymentGatewayCustomerId?: string | null;
        paymentGatewaySubscriptionId?: string | null;
      };

      const updated = await workspaceService.updateWorkspaceSubscription(id, body);
      if (!updated) {
        return reply.status(404).send({ error: 'Workspace não encontrado' });
      }

      return reply.send({
        success: true,
        message: `Assinatura do workspace "${updated.name}" atualizada para status="${updated.subscriptionStatus}" e plano="${updated.subscriptionPlan}".`,
        workspace: updated
      });
    } catch (err: any) {
      request.log.error({ err }, 'Error updating workspace subscription');
      return reply.status(500).send({ error: 'Erro ao atualizar assinatura do workspace', details: err.message });
    }
  });

  /**
   * POST /api/admin/workspaces/:id/impersonate
   * Generate an impersonation session context for superadmin to access customer tenant as admin
   */
  fastify.post('/:id/impersonate', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const impersonateSession = await workspaceService.generateImpersonateToken(id, request.user);
      return reply.send(impersonateSession);
    } catch (err: any) {
      request.log.error({ err }, 'Error generating impersonation session');
      return reply.status(400).send({ error: err.message || 'Erro ao gerar sessão de personificação' });
    }
  });
};
