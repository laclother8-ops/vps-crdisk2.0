import { User, UserRole } from '@omnicrm/shared';

export interface CreateUserInput {
  name: string;
  email: string;
  role: 'workspace_admin' | 'operator' | 'superadmin';
  password?: string;
  sipExtension?: string | null;
}

class TeamRepository {
  private users: User[] = [
    {
      id: '22222222-2222-2222-2222-222222222222',
      workspaceId: '11111111-1111-1111-1111-111111111111',
      orgId: '11111111-1111-1111-1111-111111111111',
      name: 'Carlos Oliveira',
      email: 'carlos@crdisk.com.br',
      role: 'workspace_admin',
      sipExtension: '1001',
      status: 'ONLINE',
      createdAt: new Date('2026-01-10T10:00:00Z')
    },
    {
      id: '33333333-1111-1111-1111-111111111111',
      workspaceId: '11111111-1111-1111-1111-111111111111',
      orgId: '11111111-1111-1111-1111-111111111111',
      name: 'Beatriz SDR',
      email: 'beatriz.sdr@crdisk.com.br',
      role: 'operator',
      sipExtension: '1002',
      status: 'ONLINE',
      createdAt: new Date('2026-01-15T14:20:00Z')
    },
    {
      id: '33333333-2222-2222-2222-222222222222',
      workspaceId: '11111111-1111-1111-1111-111111111111',
      orgId: '11111111-1111-1111-1111-111111111111',
      name: 'Lucas Discador',
      email: 'lucas.dialer@crdisk.com.br',
      role: 'operator',
      sipExtension: '1003',
      status: 'OFFLINE',
      createdAt: new Date('2026-02-01T09:00:00Z')
    },
    {
      id: '44444444-1111-1111-1111-111111111111',
      workspaceId: '11111111-2222-2222-2222-222222222222',
      orgId: '11111111-2222-2222-2222-222222222222',
      name: 'Diretor TechCorp',
      email: 'admin@techcorp.com.br',
      role: 'workspace_admin',
      sipExtension: '2001',
      status: 'ONLINE',
      createdAt: new Date('2026-02-01T15:00:00Z')
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
