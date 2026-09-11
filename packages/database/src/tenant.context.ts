import { PrismaClient } from '@prisma/client';
import { prisma } from './index';

/**
 * Retorna uma instância do Prisma Client com escopo estrito de Tenant.
 * Utiliza extensões do Prisma ($extends) para injetar automaticamente o filtro 'workspaceId'
 * em todas as consultas e garantir que nenhum dado vaze entre clientes.
 */
export function getTenantPrisma(workspaceId: string) {
  if (!workspaceId) {
    throw new Error('Tenant Context Error: workspaceId é obrigatório para consultas isoladas.');
  }

  return prisma.$extends({
    query: {
      lead: {
        async findMany({ args, query }) {
          args.where = { ...args.where, workspaceId } as any;
          return query(args);
        },
        async findFirst({ args, query }) {
          args.where = { ...args.where, workspaceId } as any;
          return query(args);
        },
        async findUnique({ args, query }) {
          return query(args);
        },
        async count({ args, query }) {
          args.where = { ...args.where, workspaceId } as any;
          return query(args);
        },
        async create({ args, query }) {
          args.data = { ...args.data, workspaceId } as any;
          return query(args);
        },
        async updateMany({ args, query }) {
          args.where = { ...args.where, workspaceId } as any;
          return query(args);
        },
        async deleteMany({ args, query }) {
          args.where = { ...args.where, workspaceId } as any;
          return query(args);
        }
      },
      call: {
        async findMany({ args, query }) {
          args.where = { ...args.where, workspaceId } as any;
          return query(args);
        },
        async findFirst({ args, query }) {
          args.where = { ...args.where, workspaceId } as any;
          return query(args);
        },
        async create({ args, query }) {
          args.data = { ...args.data, workspaceId } as any;
          return query(args);
        },
        async count({ args, query }) {
          args.where = { ...args.where, workspaceId } as any;
          return query(args);
        }
      },
      message: {
        async findMany({ args, query }) {
          args.where = { ...args.where, workspaceId } as any;
          return query(args);
        },
        async findFirst({ args, query }) {
          args.where = { ...args.where, workspaceId } as any;
          return query(args);
        },
        async create({ args, query }) {
          args.data = { ...args.data, workspaceId } as any;
          return query(args);
        }
      },
      followUpJob: {
        async findMany({ args, query }) {
          args.where = { ...args.where, workspaceId } as any;
          return query(args);
        },
        async findFirst({ args, query }) {
          args.where = { ...args.where, workspaceId } as any;
          return query(args);
        },
        async create({ args, query }) {
          args.data = { ...args.data, workspaceId } as any;
          return query(args);
        }
      },
      knowledgeBase: {
        async findMany({ args, query }) {
          args.where = { ...args.where, workspaceId } as any;
          return query(args);
        },
        async findFirst({ args, query }) {
          args.where = { ...args.where, workspaceId } as any;
          return query(args);
        },
        async create({ args, query }) {
          args.data = { ...args.data, workspaceId } as any;
          return query(args);
        }
      }
    }
  });
}

/**
 * Validação de autorização de Tenant
 */
export function validateTenantAccess(
  caller: { role: string; workspaceId?: string | null },
  targetWorkspaceId: string
): boolean {
  if (caller.role === 'superadmin' || caller.role === 'adm' || caller.role === 'SUPERADMIN') {
    return true;
  }
  return caller.workspaceId === targetWorkspaceId;
}

/**
 * Executa uma função dentro de um contexto isolado de Tenant
 */
export async function withTenantContext<T>(
  workspaceId: string,
  fn: (tenantDb: ReturnType<typeof getTenantPrisma>) => Promise<T>
): Promise<T> {
  const tenantDb = getTenantPrisma(workspaceId);
  return await fn(tenantDb);
}
