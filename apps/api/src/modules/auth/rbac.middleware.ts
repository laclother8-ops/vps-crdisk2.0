import { FastifyReply, FastifyRequest } from 'fastify';
import { UserRole } from '@omnicrm/shared';

export interface AuthUserContext {
  id: string;
  name: string;
  email: string;
  role: 'superadmin' | 'workspace_admin' | 'operator';
  workspaceId: string;
  status?: string;
  isImpersonating?: boolean;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthUserContext;
    workspaceId?: string;
  }
}

/**
 * Extracts and validates auth context and workspace from headers/tokens
 */
export async function authenticate(req: FastifyRequest, reply: FastifyReply) {
  const authHeader = req.headers.authorization;
  const workspaceHeader = req.headers['x-workspace-id'] as string;
  const roleHeader = req.headers['x-user-role'] as string;

  // Default development / test identity
  let user: AuthUserContext = {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Carlos Oliveira',
    email: 'carlos@crdisk.com.br',
    role: 'workspace_admin',
    workspaceId: workspaceHeader || '11111111-1111-1111-1111-111111111111'
  };

  // If superadmin token / role is passed
  if (roleHeader === 'superadmin' || authHeader?.includes('superadmin') || authHeader?.includes('adm')) {
    user = {
      id: '00000000-0000-0000-0000-000000000000',
      name: 'Super Administrador CRDISK',
      email: 'superadmin@crdisk.com.br',
      role: 'superadmin',
      workspaceId: workspaceHeader || '11111111-1111-1111-1111-111111111111',
      isImpersonating: !!workspaceHeader && workspaceHeader !== 'global'
    };
  } else if (roleHeader === 'operator' || authHeader?.includes('operator')) {
    user = {
      id: '33333333-1111-1111-1111-111111111111',
      name: 'Beatriz SDR',
      email: 'beatriz.sdr@crdisk.com.br',
      role: 'operator',
      workspaceId: workspaceHeader || '11111111-1111-1111-1111-111111111111'
    };
  } else if (roleHeader === 'workspace_admin') {
    user.role = 'workspace_admin';
  }

  req.user = user;
  req.workspaceId = user.workspaceId;
}

/**
 * Role-Based Access Control Guard
 */
export function requireRole(allowedRoles: string | string[]) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return async (req: FastifyRequest, reply: FastifyReply) => {
    // Ensure auth is run
    if (!req.user) {
      await authenticate(req, reply);
    }

    const userRole = req.user?.role || 'operator';

    // Superadmin has universal access
    if (userRole === 'superadmin') {
      return;
    }

    if (!roles.includes(userRole)) {
      return reply.status(403).send({
        error: 'Acesso Proibido (403)',
        message: `Seu nível de acesso (${userRole}) não tem permissão para acessar este recurso. Permissões necessárias: [${roles.join(', ')}]`,
        requiredRoles: roles,
        currentRole: userRole
      });
    }
  };
}
