import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { teamService } from './team.service';
import { authenticate, requireRole } from '../auth/rbac.middleware';
import { CreateTeamUserSchema, UpdateTeamUserSchema, ResetPasswordSchema } from '@omnicrm/shared';

export const teamRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Team management is strictly for superadmin and workspace_admin. Operator receives 403 Forbidden.
  fastify.addHook('preHandler', authenticate);
  fastify.addHook('preHandler', requireRole(['superadmin', 'workspace_admin']));

  /**
   * GET /api/team/users
   * List all team members belonging to the current tenant workspace
   */
  fastify.get('/users', async (request, reply) => {
    try {
      const workspaceId = request.workspaceId;
      if (!workspaceId) {
        return reply.status(400).send({ error: 'Workspace ID não identificado na requisição' });
      }

      const users = await teamService.listUsersByWorkspace(workspaceId);
      return reply.send({ users, total: users.length, workspaceId });
    } catch (err: any) {
      request.log.error({ err }, 'Error listing workspace team members');
      return reply.status(500).send({ error: 'Erro ao listar membros da equipe', details: err.message });
    }
  });

  /**
   * POST /api/team/users
   * Create a new team member within the tenant workspace (workspace_admin or operator)
   */
  fastify.post('/users', async (request, reply) => {
    try {
      const workspaceId = request.workspaceId;
      if (!workspaceId) {
        return reply.status(400).send({ error: 'Workspace ID obrigatório' });
      }

      const parseResult = CreateTeamUserSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: 'Dados de usuário inválidos',
          issues: parseResult.error.format()
        });
      }

      const newUser = await teamService.createUserForWorkspace(workspaceId, parseResult.data);
      return reply.status(201).send(newUser);
    } catch (err: any) {
      request.log.error({ err }, 'Error creating team member');
      return reply.status(400).send({ error: err.message || 'Erro ao criar membro da equipe' });
    }
  });

  /**
   * PATCH /api/team/users/:id
   * Update name or role of a team member in the workspace
   */
  fastify.patch('/users/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const workspaceId = request.workspaceId;
      if (!workspaceId) {
        return reply.status(400).send({ error: 'Workspace ID não identificado na requisição' });
      }

      const parseResult = UpdateTeamUserSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: 'Dados de atualização inválidos',
          issues: parseResult.error.format()
        });
      }

      const updated = await teamService.updateUser(id, workspaceId, parseResult.data);
      if (!updated) {
        return reply.status(404).send({ error: 'Usuário não encontrado no workspace atual' });
      }

      return reply.send({ success: true, user: updated });
    } catch (err: any) {
      request.log.error({ err }, 'Error updating team member');
      return reply.status(400).send({ error: err.message || 'Erro ao atualizar membro da equipe' });
    }
  });

  /**
   * POST /api/team/users/:id/reset-password
   * Reset the password for a team member
   */
  fastify.post('/users/:id/reset-password', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const workspaceId = request.workspaceId;
      if (!workspaceId) {
        return reply.status(400).send({ error: 'Workspace ID não identificado na requisição' });
      }

      const parseResult = ResetPasswordSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: 'Nova senha inválida. Deve conter ao menos 6 caracteres.',
          issues: parseResult.error.format()
        });
      }

      const result = await teamService.resetUserPassword(id, workspaceId, parseResult.data.newPassword);
      return reply.send(result);
    } catch (err: any) {
      request.log.error({ err }, 'Error resetting password');
      return reply.status(400).send({ error: err.message || 'Erro ao redefinir senha' });
    }
  });

  /**
   * DELETE /api/team/users/:id
   * Delete / remove a team member from the workspace
   */
  fastify.delete('/users/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const workspaceId = request.workspaceId;
      if (!workspaceId) {
        return reply.status(400).send({ error: 'Workspace ID não identificado na requisição' });
      }

      const result = await teamService.removeUser(id, workspaceId);
      return reply.send(result);
    } catch (err: any) {
      request.log.error({ err }, 'Error removing team member');
      return reply.status(400).send({ error: err.message || 'Erro ao remover usuário' });
    }
  });
};
