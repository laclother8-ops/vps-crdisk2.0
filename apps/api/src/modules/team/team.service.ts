import crypto from 'crypto';
import { User, UserRole, PLAN_USER_LIMITS, WorkspaceInvite } from '@omnicrm/shared';
import { workspaceService } from '../workspaces/workspace.service.js';

export interface CreateUserInput {
  name: string;
  email: string;
  role: string;
  password?: string;
  sipExtension?: string | null;
}

export interface InviteMemberInput {
  email: string;
  name?: string | null;
  role?: string;
}

class TeamRepository {
  private users: (User & { isActive?: boolean })[] = [
    {
      id: '22222222-2222-2222-2222-222222222222',
      workspaceId: '11111111-1111-1111-1111-111111111111',
      orgId: '11111111-1111-1111-1111-111111111111',
      name: 'Carlos Oliveira',
      email: 'carlos@crdisk.com.br',
      role: 'OWNER',
      sipExtension: '1001',
      status: 'ONLINE',
      isActive: true,
      createdAt: new Date('2026-01-10T10:00:00Z')
    },
    {
      id: '33333333-1111-1111-1111-111111111111',
      workspaceId: '11111111-1111-1111-1111-111111111111',
      orgId: '11111111-1111-1111-1111-111111111111',
      name: 'Beatriz SDR',
      email: 'beatriz.sdr@crdisk.com.br',
      role: 'SALES_REP',
      sipExtension: '1002',
      status: 'ONLINE',
      isActive: true,
      createdAt: new Date('2026-01-15T14:20:00Z')
    },
    {
      id: '33333333-2222-2222-2222-222222222222',
      workspaceId: '11111111-1111-1111-1111-111111111111',
      orgId: '11111111-1111-1111-1111-111111111111',
      name: 'Lucas Discador',
      email: 'lucas.dialer@crdisk.com.br',
      role: 'STOCK_OPERATOR',
      sipExtension: '1003',
      status: 'OFFLINE',
      isActive: true,
      createdAt: new Date('2026-02-01T09:00:00Z')
    },
    {
      id: '44444444-1111-1111-1111-111111111111',
      workspaceId: '11111111-2222-2222-2222-222222222222',
      orgId: '11111111-2222-2222-2222-222222222222',
      name: 'Diretor TechCorp',
      email: 'admin@techcorp.com.br',
      role: 'ADMIN',
      sipExtension: '2001',
      status: 'ONLINE',
      isActive: true,
      createdAt: new Date('2026-02-01T15:00:00Z')
    }
  ];

  // In-memory store for pending invites
  private invites: WorkspaceInvite[] = [
    {
      id: 'inv-demo-1',
      workspaceId: '11111111-1111-1111-1111-111111111111',
      email: 'financeiro.novo@crdisk.com.br',
      name: 'Mariana Financeiro',
      role: 'FINANCIAL',
      token: 'demo-token-financeiro-123',
      expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      acceptedAt: null
    }
  ];

  async listUsersByWorkspace(workspaceId: string): Promise<User[]> {
    return this.users.filter(u => u.workspaceId === workspaceId || (u as any).orgId === workspaceId);
  }

  async listAllUsersAcrossPlatform(): Promise<User[]> {
    return this.users;
  }

  async getUserById(id: string): Promise<User | undefined> {
    return this.users.find(u => u.id === id);
  }

  /**
   * Convidar novo membro com verificação estrita do limite do plano
   */
  async inviteMember(workspaceId: string, input: InviteMemberInput): Promise<{ invite: WorkspaceInvite; inviteUrl: string }> {
    const workspace = await workspaceService.getWorkspaceById(workspaceId);
    const plan = (workspace?.subscriptionPlan || workspace?.plan || 'starter').toLowerCase();
    const limit = PLAN_USER_LIMITS[plan] ?? 1;

    // Contar membros ativos atuais
    const currentActiveCount = this.users.filter(
      u => (u.workspaceId === workspaceId || (u as any).orgId === workspaceId) && u.isActive !== false
    ).length;

    if (currentActiveCount >= limit) {
      const error: any = new Error(`Seu plano atual (${plan.toUpperCase()}) atingiu o limite de ${limit} operador(es). Faça upgrade para adicionar mais membros.`);
      error.code = 'PLAN_LIMIT_REACHED';
      error.plan = plan;
      error.current = currentActiveCount;
      error.limit = limit;
      throw error;
    }

    // Verificar se já é membro ativo
    const emailLower = input.email.trim().toLowerCase();
    const alreadyMember = this.users.find(
      u => (u.workspaceId === workspaceId || (u as any).orgId === workspaceId) && u.email.toLowerCase() === emailLower
    );
    if (alreadyMember && alreadyMember.isActive !== false) {
      throw new Error(`O usuário ${input.email} já é um membro ativo desta equipe.`);
    }

    // Gerar token seguro único
    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dias

    // Cancelar convite pendente prévio para o mesmo e-mail, se existir
    this.invites = this.invites.filter(i => !(i.workspaceId === workspaceId && i.email.toLowerCase() === emailLower && !i.acceptedAt));

    const newInvite: WorkspaceInvite = {
      id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      workspaceId,
      email: emailLower,
      name: input.name?.trim() || null,
      role: input.role || 'SALES_REP',
      token,
      expiresAt,
      createdAt: new Date(),
      acceptedAt: null
    };

    this.invites.unshift(newInvite);

    return {
      invite: newInvite,
      inviteUrl: `/invite/${token}`
    };
  }

  async listPendingInvites(workspaceId: string): Promise<WorkspaceInvite[]> {
    const now = new Date();
    return this.invites.filter(i => 
      i.workspaceId === workspaceId && 
      !i.acceptedAt && 
      new Date(i.expiresAt) > now
    );
  }

  async resendInvite(workspaceId: string, inviteId: string): Promise<{ success: boolean; inviteUrl: string; token: string }> {
    const invite = this.invites.find(i => i.id === inviteId && i.workspaceId === workspaceId);
    if (!invite) {
      throw new Error('Convite não encontrado.');
    }

    // Renovar validade por mais 7 dias
    invite.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return {
      success: true,
      inviteUrl: `/invite/${invite.token}`,
      token: invite.token
    };
  }

  async cancelInvite(workspaceId: string, inviteId: string): Promise<{ success: boolean }> {
    const idx = this.invites.findIndex(i => i.id === inviteId && i.workspaceId === workspaceId);
    if (idx === -1) {
      throw new Error('Convite não encontrado.');
    }
    this.invites.splice(idx, 1);
    return { success: true };
  }

  /**
   * Bloquear ou Desbloquear acesso de um membro sem deletar histórico
   */
  async toggleUserActive(userId: string, workspaceId: string, isActive: boolean): Promise<User> {
    const user = this.users.find(u => u.id === userId && (u.workspaceId === workspaceId || (u as any).orgId === workspaceId));
    if (!user) {
      throw new Error('Usuário não encontrado na equipe.');
    }

    user.isActive = isActive;
    user.status = isActive ? 'ONLINE' : 'OFFLINE';
    return user;
  }

  /**
   * Alterar papel/função de um membro
   */
  async updateUserRole(userId: string, workspaceId: string, role: string): Promise<User> {
    const user = this.users.find(u => u.id === userId && (u.workspaceId === workspaceId || (u as any).orgId === workspaceId));
    if (!user) {
      throw new Error('Usuário não encontrado na equipe.');
    }

    user.role = role;
    return user;
  }

  /**
   * Reatribuir leads e clientes de um operador para outro
   */
  async reassignLeads(workspaceId: string, fromUserId: string, toUserId: string): Promise<{ reassignedCount: number; message: string }> {
    const targetUser = this.users.find(u => u.id === toUserId && (u.workspaceId === workspaceId || (u as any).orgId === workspaceId));
    if (!targetUser) {
      throw new Error('Operador de destino não encontrado no workspace.');
    }

    // Integrar com CRM Service em memória para reatribuir leads
    const { crmService } = await import('../crm/crm.service.js');
    const res = await crmService.listLeads({ workspaceId, limit: 1000 });
    const leads = res.data || [];
    let count = 0;

    for (const lead of leads) {
      if ((lead as any).assignedToId === fromUserId || (lead as any).assignedUserId === fromUserId) {
        (lead as any).assignedToId = toUserId;
        (lead as any).assignedUserId = toUserId;
        count++;
      }
    }

    return {
      reassignedCount: count,
      message: `${count} cliente(s) e lead(s) reatribuídos com sucesso para ${targetUser.name}.`
    };
  }

  /**
   * Validação pública de token de convite
   */
  async validateInvite(token: string): Promise<{ valid: boolean; email: string; name?: string | null; role: string; workspaceName: string; workspaceId: string }> {
    const invite = this.invites.find(i => i.token === token);
    if (!invite) {
      throw new Error('Convite não encontrado ou link inválido.');
    }

    if (invite.acceptedAt) {
      throw new Error('Este convite já foi aceito anteriormente.');
    }

    if (new Date(invite.expiresAt) < new Date()) {
      throw new Error('Este convite expirou. Solicite um novo link ao administrador da empresa.');
    }

    const workspace = await workspaceService.getWorkspaceById(invite.workspaceId);

    return {
      valid: true,
      email: invite.email,
      name: invite.name,
      role: invite.role,
      workspaceName: workspace?.name || 'CRDISK Enterprise',
      workspaceId: invite.workspaceId
    };
  }

  /**
   * Aceite de convite e criação da conta do operador
   */
  async acceptInvite(token: string, data: { name: string; password?: string }): Promise<{ success: boolean; token: string; user: User; workspace: any }> {
    const invite = this.invites.find(i => i.token === token);
    if (!invite || invite.acceptedAt || new Date(invite.expiresAt) < new Date()) {
      throw new Error('Convite inválido ou expirado.');
    }

    // Criar ou ativar o usuário
    let user = this.users.find(u => u.email.toLowerCase() === invite.email.toLowerCase() && u.workspaceId === invite.workspaceId);
    if (!user) {
      user = {
        id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        workspaceId: invite.workspaceId,
        orgId: invite.workspaceId,
        name: data.name.trim(),
        email: invite.email.toLowerCase(),
        role: invite.role,
        password: data.password,
        sipExtension: `${1000 + this.users.length + 1}`,
        status: 'ONLINE',
        isActive: true,
        createdAt: new Date()
      };
      this.users.unshift(user);
    } else {
      user.name = data.name.trim();
      user.password = data.password;
      user.isActive = true;
      user.role = invite.role;
    }

    // Marcar convite como aceito
    invite.acceptedAt = new Date();

    const workspace = await workspaceService.getWorkspaceById(invite.workspaceId);
    const authToken = `token-${user.id}-${Date.now()}`;

    return {
      success: true,
      token: authToken,
      user,
      workspace: workspace || {
        id: invite.workspaceId,
        name: 'CRDISK Enterprise',
        slug: 'crdisk'
      }
    };
  }

  async createUserForWorkspace(workspaceId: string, input: CreateUserInput): Promise<User> {
    const existing = this.users.find(u => u.email.toLowerCase() === input.email.toLowerCase());
    if (existing) {
      throw new Error(`O e-mail "${input.email}" já está cadastrado.`);
    }

    const newUser: User = {
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      workspaceId,
      orgId: workspaceId,
      name: input.name,
      email: input.email.toLowerCase(),
      role: input.role,
      sipExtension: input.sipExtension || `${1000 + this.users.length + 1}`,
      status: 'ONLINE',
      isActive: true,
      createdAt: new Date()
    };

    this.users.unshift(newUser);
    return newUser;
  }

  async updateUser(userId: string, workspaceId: string, data: Partial<User>): Promise<User | null> {
    const user = this.users.find(u => u.id === userId && (u.workspaceId === workspaceId || (u as any).orgId === workspaceId));
    if (!user) return null;

    Object.assign(user, data);
    return user;
  }

  async resetUserPassword(userId: string, workspaceId: string, newPassword?: string): Promise<{ success: boolean; message: string; tempPassword?: string }> {
    const user = this.users.find(u => u.id === userId && (u.workspaceId === workspaceId || (u as any).orgId === workspaceId));
    if (!user) {
      throw new Error('Usuário não encontrado no workspace.');
    }

    const tempPassword = newPassword || `Temp@${Math.floor(100000 + Math.random() * 900000)}`;
    user.password = tempPassword;
    console.log(`[RBAC Security] Reset password for user ${user.email}: "${tempPassword}"`);

    return {
      success: true,
      message: `Senha redefinida com sucesso para ${user.email}.`,
      tempPassword
    };
  }

  async removeUser(userId: string, workspaceId: string): Promise<boolean> {
    const idx = this.users.findIndex(u => u.id === userId && (u.workspaceId === workspaceId || (u as any).orgId === workspaceId));
    if (idx === -1) return false;

    this.users.splice(idx, 1);
    return true;
  }
}

export const teamService = new TeamRepository();
