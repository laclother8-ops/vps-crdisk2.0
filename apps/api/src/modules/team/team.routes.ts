import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { teamService } from './team.service.js';
import { authenticate, requireRole } from '../auth/rbac.middleware.js';
import { 
  CreateTeamUserSchema, 
  UpdateTeamUserSchema, 
  ResetPasswordSchema,
  InviteMemberSchema,
  AcceptInviteSchema
} from '@omnicrm/shared';

export const teamRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // =========================================================================
  // ROTAS PÚBLICAS DE CONVITE (Sem middleware de autenticação / financeiro)
  // =========================================================================

  /**
   * GET /api/team/public/invite/:token
   * Valida o token e retorna dados do convite para a tela de aceite
   */
  fastify.get('/public/invite/:token', async (request, reply) => {
    try {
      const { token } = request.params as { token: string };
      const details = await teamService.validateInvite(token);
      return reply.send(details);
    } catch (err: any) {
      return reply.status(400).send({ 
        valid: false, 
        error: err.message || 'Convite inválido ou expirado.' 
      });
    }
  });

  /**
   * POST /api/team/public/invite/:token/accept
   * Conclui o aceite do convite criando a senha do operador e retornando sessão
   */
  fastify.post('/public/invite/:token/accept', async (request, reply) => {
    try {
      const { token } = request.params as { token: string };
      const parseResult = AcceptInviteSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: 'Dados inválidos.',
          issues: parseResult.error.format()
        });
      }

      const result = await teamService.acceptInvite(token, parseResult.data);
      return reply.status(200).send(result);
    } catch (err: any) {
      return reply.status(400).send({ 
        error: err.message || 'Erro ao processar aceite de convite.' 
      });
    }
  });

  // =========================================================================
  // ROTAS ADMINISTRATIVAS DE GESTÃO DA EQUIPE (Requer OWNER ou ADMIN)
  // =========================================================================
  fastify.register(async (adminScope) => {
    adminScope.addHook('preHandler', authenticate);
    adminScope.addHook('preHandler', requireRole(['superadmin', 'workspace_admin', 'OWNER', 'ADMIN', 'adm']));

    /**
     * GET /api/team/users
     * Lista todos os integrantes da equipe com status ativo/inativo
     */
    adminScope.get('/users', async (request, reply) => {
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
     * POST /api/team/invite
     * Convida novo membro validando teto de operadores do plano (Starter: 1, Pro: 3, Enterprise: inf)
     */
    adminScope.post('/invite', async (request, reply) => {
      try {
        const workspaceId = request.workspaceId;
        if (!workspaceId) {
          return reply.status(400).send({ error: 'Workspace ID obrigatório' });
        }

        const parseResult = InviteMemberSchema.safeParse(request.body);
        if (!parseResult.success) {
          return reply.status(400).send({
            error: 'Dados de convite inválidos',
            issues: parseResult.error.format()
          });
        }

        const result = await teamService.inviteMember(workspaceId, parseResult.data);
        return reply.status(201).send(result);
      } catch (err: any) {
        if (err.code === 'PLAN_LIMIT_REACHED') {
          return reply.status(403).send({
            error: 'PLAN_LIMIT_REACHED',
            message: err.message,
            plan: err.plan,
            current: err.current,
            limit: err.limit
          });
        }
        return reply.status(400).send({ error: err.message || 'Erro ao enviar convite' });
      }
    });

    /**
     * GET /api/team/invites
     * Lista convites pendentes de aceite do workspace
     */
    adminScope.get('/invites', async (request, reply) => {
      try {
        const workspaceId = request.workspaceId;
        if (!workspaceId) {
          return reply.status(400).send({ error: 'Workspace ID obrigatório' });
        }

        const invites = await teamService.listPendingInvites(workspaceId);
        return reply.send({ invites, total: invites.length });
      } catch (err: any) {
        return reply.status(500).send({ error: 'Erro ao buscar convites pendentes' });
      }
    });

    /**
     * POST /api/team/invites/:id/resend
     * Renova o prazo e reenvia o link do convite
     */
    adminScope.post('/invites/:id/resend', async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const workspaceId = request.workspaceId!;
        const result = await teamService.resendInvite(workspaceId, id);
        return reply.send(result);
      } catch (err: any) {
        return reply.status(400).send({ error: err.message || 'Erro ao reenviar convite' });
      }
    });

    /**
     * DELETE /api/team/invites/:id
     * Cancela e remove um convite pendente
     */
    adminScope.delete('/invites/:id', async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const workspaceId = request.workspaceId!;
        const result = await teamService.cancelInvite(workspaceId, id);
        return reply.send(result);
      } catch (err: any) {
        return reply.status(400).send({ error: err.message || 'Erro ao cancelar convite' });
      }
    });

    /**
     * PATCH /api/team/users/:id/status
     * Bloqueia ou reativa o acesso de um integrante sem apagar seu histórico de vendas
     */
    adminScope.patch('/users/:id/status', async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const workspaceId = request.workspaceId!;
        const { isActive } = request.body as { isActive: boolean };

        const updated = await teamService.toggleUserActive(id, workspaceId, isActive);
        return reply.send({ success: true, user: updated });
      } catch (err: any) {
        return reply.status(400).send({ error: err.message || 'Erro ao alterar status do usuário' });
      }
    });

    /**
     * PATCH /api/team/users/:id/role
     * Altera a função/cargo do operador (OWNER, ADMIN, SALES_REP, STOCK_OPERATOR, FINANCIAL)
     */
    adminScope.patch('/users/:id/role', async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const workspaceId = request.workspaceId!;
        const { role } = request.body as { role: string };

        if (!role) {
          return reply.status(400).send({ error: 'O novo papel (role) é obrigatório.' });
        }

        const updated = await teamService.updateUserRole(id, workspaceId, role);
        return reply.send({ success: true, user: updated });
      } catch (err: any) {
        return reply.status(400).send({ error: err.message || 'Erro ao alterar papel do usuário' });
      }
    });

    /**
     * POST /api/team/users/:id/reassign
     * Reatribui a carteira de clientes/leads e pedidos de um operador para outro
     */
    adminScope.post('/users/:id/reassign', async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const workspaceId = request.workspaceId!;
        const { toUserId } = request.body as { toUserId: string };

        if (!toUserId) {
          return reply.status(400).send({ error: 'Operador de destino (toUserId) é obrigatório.' });
        }

        const result = await teamService.reassignLeads(workspaceId, id, toUserId);
        return reply.send(result);
      } catch (err: any) {
        return reply.status(400).send({ error: err.message || 'Erro ao reatribuir clientes' });
      }
    });

    /**
     * POST /api/team/users
     * Criação direta de integrante
     */
    adminScope.post('/users', async (request, reply) => {
      try {
        const workspaceId = request.workspaceId!;
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
        return reply.status(400).send({ error: err.message || 'Erro ao criar membro da equipe' });
      }
    });

    /**
     * POST /api/team/users/:id/reset-password
     */
    adminScope.post('/users/:id/reset-password', async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const workspaceId = request.workspaceId!;
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
        return reply.status(400).send({ error: err.message || 'Erro ao redefinir senha' });
      }
    });

    /**
     * DELETE /api/team/users/:id
     */
    adminScope.delete('/users/:id', async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const workspaceId = request.workspaceId!;
        const result = await teamService.removeUser(id, workspaceId);
        return reply.send({ success: result });
      } catch (err: any) {
        return reply.status(400).send({ error: err.message || 'Erro ao remover usuário' });
      }
    });
  });
};
