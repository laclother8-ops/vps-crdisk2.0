import { Workspace } from '@omnicrm/shared';
import { initialSeedData } from '@omnicrm/database/dist/seed.js';

export interface WorkspaceCreationInput {
  name: string;
  slug: string;
  plan?: string;
  adminName: string;
  adminEmail: string;
  adminPassword?: string;
}

class WorkspaceRepository {
  private workspaces: Workspace[] = [
    {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'CRDISK Enterprise',
      slug: 'crdisk-enterprise',
      plan: 'enterprise',
      status: 'active',
      subscriptionStatus: 'active',
      subscriptionPlan: 'enterprise',
      trialEndsAt: null,
      currentPeriodEnd: new Date('2028-01-01T00:00:00Z'),
      memberCount: 3,
      leadsCount: 124,
      callsCount: 840,
      createdAt: new Date('2026-01-10T10:00:00Z'),
      updatedAt: new Date()
    },
    {
      id: '11111111-2222-2222-2222-222222222222',
      name: 'TechCorp Inovação',
      slug: 'techcorp',
      plan: 'pro',
      status: 'active',
      subscriptionStatus: 'active',
      subscriptionPlan: 'pro',
      trialEndsAt: null,
      currentPeriodEnd: new Date('2027-01-01T00:00:00Z'),
      memberCount: 5,
      leadsCount: 68,
      callsCount: 390,
      createdAt: new Date('2026-02-01T14:30:00Z'),
      updatedAt: new Date()
    },
    {
      id: '11111111-3333-3333-3333-333333333333',
      name: 'Varejo Plus Brasil',
      slug: 'varejo-plus',
      plan: 'starter',
      status: 'active',
      subscriptionStatus: 'pending_payment',
      subscriptionPlan: 'starter',
      trialEndsAt: null,
      currentPeriodEnd: null,
      memberCount: 2,
      leadsCount: 32,
      callsCount: 180,
      createdAt: new Date('2026-02-15T09:15:00Z'),
      updatedAt: new Date()
    }
  ];

  async listWorkspaces(params?: { page?: number; limit?: number; search?: string; status?: string }): Promise<any> {
    let result = [...this.workspaces];
    if (params?.status) {
      result = result.filter(w => w.status === params.status);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      result = result.filter(w => w.name.toLowerCase().includes(q) || w.slug.toLowerCase().includes(q));
    }
    if (params?.page && params?.limit) {
      const start = (params.page - 1) * params.limit;
      const paginated = result.slice(start, start + params.limit);
      return {
        data: paginated,
        total: result.length,
        page: params.page,
        limit: params.limit
      };
    }
    return result;
  }

  async getWorkspaceById(id?: string): Promise<Workspace | undefined> {
    if (!id) return undefined;
    return this.workspaces.find(w => w.id === id || w.slug === id);
  }

  async createWorkspace(input: WorkspaceCreationInput): Promise<{ workspace: Workspace; adminUser: any }> {
    const existing = this.workspaces.find(w => w.slug === input.slug.toLowerCase());
    if (existing) {
      throw new Error(`O slug "${input.slug}" já está em uso por outro Workspace.`);
    }

    const newWorkspace: Workspace = {
      id: `ws-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: input.name,
      slug: input.slug.toLowerCase(),
      plan: input.plan || 'enterprise',
      status: 'active',
      subscriptionStatus: 'trial',
      subscriptionPlan: input.plan || 'pro',
      trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias de trial padrão para novos cadastros
      currentPeriodEnd: null,
      memberCount: 1,
      leadsCount: 0,
      callsCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.workspaces.unshift(newWorkspace);

    // Create initial admin user in team repository
    const { teamService } = await import('../team/team.service.js');
    const adminUser = await teamService.createUserForWorkspace(newWorkspace.id, {
      name: input.adminName,
      email: input.adminEmail,
      role: 'workspace_admin',
      password: input.adminPassword || '123456'
    });

    console.log(`[Multi-tenant] Created Workspace "${newWorkspace.name}" (${newWorkspace.id}) with Admin ${adminUser.email}`);
    return { workspace: newWorkspace, adminUser };
  }

  async updateWorkspaceStatus(id: string, status: string): Promise<Workspace | null> {
    const ws = this.workspaces.find(w => w.id === id);
    if (!ws) return null;

    ws.status = status;
    ws.updatedAt = new Date();
    return ws;
  }

  async updateWorkspaceSubscription(
    id: string, 
    data: { 
      subscriptionStatus?: string; 
      subscriptionPlan?: string; 
      trialEndsAt?: Date | string | null; 
      currentPeriodEnd?: Date | string | null;
      paymentGatewayCustomerId?: string | null;
      paymentGatewaySubscriptionId?: string | null;
    }
  ): Promise<Workspace | null> {
    const ws = this.workspaces.find(w => w.id === id || w.slug === id);
    if (!ws) return null;

    if (data.subscriptionStatus !== undefined) ws.subscriptionStatus = data.subscriptionStatus;
    if (data.subscriptionPlan !== undefined) {
      ws.subscriptionPlan = data.subscriptionPlan;
      ws.plan = data.subscriptionPlan;
    }
    if (data.trialEndsAt !== undefined) {
      ws.trialEndsAt = data.trialEndsAt ? new Date(data.trialEndsAt) : null;
    }
    if (data.currentPeriodEnd !== undefined) {
      ws.currentPeriodEnd = data.currentPeriodEnd ? new Date(data.currentPeriodEnd) : null;
    }
    if (data.paymentGatewayCustomerId !== undefined) {
      ws.paymentGatewayCustomerId = data.paymentGatewayCustomerId;
    }
    if (data.paymentGatewaySubscriptionId !== undefined) {
      ws.paymentGatewaySubscriptionId = data.paymentGatewaySubscriptionId;
    }

    ws.updatedAt = new Date();
    console.log(`[Billing] Workspace "${ws.name}" (${ws.id}) subscription updated to status="${ws.subscriptionStatus}", plan="${ws.subscriptionPlan}"`);
    return ws;
  }

  async handlePaymentWebhook(event: {
    type: string;
    workspaceId?: string;
    customerId?: string;
    subscriptionId?: string;
    plan?: string;
    amount?: number;
  }): Promise<{ success: boolean; workspace?: Workspace; actionTaken: string }> {
    const { type, workspaceId, customerId, subscriptionId, plan } = event;

    // Find target workspace
    let ws: Workspace | undefined;
    if (workspaceId) {
      ws = this.workspaces.find(w => w.id === workspaceId || w.slug === workspaceId);
    }
    if (!ws && customerId) {
      ws = this.workspaces.find(w => w.paymentGatewayCustomerId === customerId);
    }
    if (!ws && this.workspaces.length > 0) {
      // Fallback to first non-active or matching workspace for demo / webhook simulation
      ws = this.workspaces.find(w => w.subscriptionStatus === 'pending_payment') || this.workspaces[0];
    }

    if (!ws) {
      return { success: false, actionTaken: 'Workspace not found for webhook' };
    }

    const eventName = type.toLowerCase();

    // 1. Payment Succeeded / Invoice Paid / Subscription Created
    if (
      eventName === 'payment.succeeded' || 
      eventName === 'invoice.paid' || 
      eventName === 'checkout.session.completed' ||
      eventName === 'subscription.active' ||
      eventName === 'pix.received'
    ) {
      const nextMonth = new Date();
      nextMonth.setDate(nextMonth.getDate() + 30);

      await this.updateWorkspaceSubscription(ws.id, {
        subscriptionStatus: 'active',
        subscriptionPlan: plan || ws.subscriptionPlan || 'pro',
        currentPeriodEnd: nextMonth,
        trialEndsAt: null,
        paymentGatewayCustomerId: customerId || ws.paymentGatewayCustomerId,
        paymentGatewaySubscriptionId: subscriptionId || ws.paymentGatewaySubscriptionId
      });

      return { success: true, workspace: ws, actionTaken: `Workspace ${ws.name} activated until ${nextMonth.toISOString()}` };
    }

    // 2. Payment Failed / Subscription Past Due / Canceled
    if (
      eventName === 'payment.failed' ||
      eventName === 'invoice.payment_failed' ||
      eventName === 'subscription.canceled' ||
      eventName === 'subscription.past_due'
    ) {
      const newStatus = eventName.includes('canceled') ? 'canceled' : 'past_due';
      await this.updateWorkspaceSubscription(ws.id, {
        subscriptionStatus: newStatus
      });

      return { success: true, workspace: ws, actionTaken: `Workspace ${ws.name} status updated to ${newStatus}` };
    }

    return { success: true, workspace: ws, actionTaken: `Ignored unhandled event: ${type}` };
  }

  async getGlobalMetrics() {
    const totalWorkspaces = this.workspaces.length;
    const activeWorkspaces = this.workspaces.filter(w => w.status === 'active').length;
    
    const { teamService } = await import('../team/team.service.js');
    const allUsers = await teamService.listAllUsersAcrossPlatform();

    const totalLeads = this.workspaces.reduce((sum, w) => sum + (w.leadsCount || 0), 0);
    const totalCalls = this.workspaces.reduce((sum, w) => sum + (w.callsCount || 0), 0);

    return {
      totalWorkspaces,
      activeWorkspaces,
      totalUsers: allUsers.length,
      totalLeads,
      totalCalls,
      activeAIAgents: totalWorkspaces * 2
    };
  }

  async generateImpersonateToken(workspaceId: string, _superadminContext?: any) {
    const ws = await this.getWorkspaceById(workspaceId);
    if (!ws) throw new Error('Workspace não encontrado.');

    return {
      success: true,
      isImpersonating: true,
      impersonateToken: `impersonate_${workspaceId}_${Date.now()}`,
      targetWorkspace: ws,
      workspace: ws,
      message: `Sessão de suporte iniciada para o Workspace "${ws.name}".`
    };
  }
}

export const workspaceService = new WorkspaceRepository();
