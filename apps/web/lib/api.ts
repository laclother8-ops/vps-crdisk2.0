const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  
  const headers: Record<string, string> = {};
  try {
    const token = localStorage.getItem('crdisk_token');
    const userRole = localStorage.getItem('crdisk_user_role');
    const activeWorkspaceId = localStorage.getItem('crdisk_active_workspace_id');
    const impersonating = localStorage.getItem('crdisk_impersonating');

    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (userRole) headers['x-user-role'] = userRole;
    if (activeWorkspaceId) headers['x-workspace-id'] = activeWorkspaceId;
    if (impersonating === 'true') headers['x-impersonating'] = 'true';
  } catch (e) {
    // Ignore in SSR
  }
  return headers;
}

export async function fetcher<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
        ...(options?.headers || {})
      }
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.error || err.message || 'Erro na requisição');
    }

    return await res.json();
  } catch (error) {
    console.warn(`[API] Fetch failed for ${endpoint}:`, error);
    throw error;
  }
}

export const api = {
  // Auth & Session
  login: (credentials: { username?: string; email?: string; password: string }) =>
    fetcher('/api/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  getMe: () => fetcher('/api/auth/me'),

  // Leads & Pipeline
  getLeads: (params?: { page?: number; limit?: number; search?: string; status?: string; funnelStage?: string; workspaceId?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.search) query.append('search', params.search);
    if (params?.status) query.append('status', params.status);
    if (params?.funnelStage) query.append('funnelStage', params.funnelStage);
    if (params?.workspaceId) query.append('workspaceId', params.workspaceId);
    const qs = query.toString();
    return fetcher(qs ? `/api/crm/leads?${qs}` : '/api/crm/leads');
  },
  getLeadById: (id: string) => fetcher(`/api/crm/leads/${id}`),
  createLead: (data: any) => fetcher('/api/crm/leads', { method: 'POST', body: JSON.stringify(data) }),
  updateLead: (id: string, data: any) => fetcher(`/api/crm/leads/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteLead: (id: string) => fetcher(`/api/crm/leads/${id}`, { method: 'DELETE' }),
  getLeadTimeline: (id: string) => fetcher(`/api/crm/leads/${id}/timeline`),
  addLeadNote: (id: string, content: string, authorName = 'Atendente') =>
    fetcher(`/api/crm/leads/${id}/notes`, { method: 'POST', body: JSON.stringify({ content, authorName }) }),
  moveDealStage: (id: string, funnelStage: string) => 
    fetcher(`/api/crm/leads/${id}/stage`, { method: 'PATCH', body: JSON.stringify({ funnelStage }) }),
  updateContactStatus: (id: string, status: string, optOut?: boolean) =>
    fetcher(`/api/crm/leads/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, optOut }) }),
  getFollowupQueue: () => fetcher('/api/crm/followup-queue'),
  processFollowupQueueNow: () => fetcher('/api/crm/followup-queue/process-now', { method: 'POST' }),
  cancelFollowupQueueItem: (id: string, reason?: string) => 
    fetcher(`/api/crm/followup-queue/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }),
  enqueueFollowup: (leadId: string, triggerType = 'MANUAL', delayMinutes = 15) =>
    fetcher('/api/crm/followup-queue/enqueue', { method: 'POST', body: JSON.stringify({ leadId, triggerType, delayMinutes }) }),

  // Unified Inbox & Chat
  getConversations: (filter?: string, channel?: string) => {
    const query = new URLSearchParams();
    if (filter && filter !== 'all') query.append('filter', filter);
    if (channel && channel !== 'ALL' && channel !== 'all') query.append('channel', channel);
    const qs = query.toString();
    return fetcher(qs ? `/api/chat/conversations?${qs}` : '/api/chat/conversations');
  },
  getTemplates: () => fetcher('/api/chat/templates'),
  getMessagesByLead: (leadId: string) => fetcher(`/api/chat/leads/${leadId}/messages`),
  sendMessage: (leadId: string, content: string, sender = 'human', channel = 'WHATSAPP', type = 'text', mediaUrl?: string, duration?: number) =>
    fetcher('/api/chat/messages', {
      method: 'POST',
      body: JSON.stringify({ leadId, content, sender, channel, type, mediaUrl, duration })
    }),
  toggleHumanMode: (leadId: string, isHuman: boolean) =>
    fetcher(`/api/chat/conversations/${leadId}/human-mode`, {
      method: 'PATCH',
      body: JSON.stringify({ isHuman })
    }),
  transferConversation: (leadId: string, targetUserId?: string, targetDepartment?: string, notes?: string) =>
    fetcher(`/api/chat/conversations/${leadId}/transfer`, {
      method: 'POST',
      body: JSON.stringify({ targetUserId, targetDepartment, notes })
    }),
  notifyTyping: (leadId: string, sender = 'human') =>
    fetcher(`/api/chat/conversations/${leadId}/typing`, {
      method: 'POST',
      body: JSON.stringify({ sender })
    }),

  // Telephony & Smart Dialer
  getWebRTCToken: (identity?: string) => fetcher(`/api/telephony/token?identity=${identity || ''}`),
  getCalls: () => fetcher('/api/telephony/calls'),
  getActiveCall: () => fetcher('/api/telephony/calls/active'),
  dial: (leadId: string) =>
    fetcher('/api/telephony/calls/dial', { method: 'POST', body: JSON.stringify({ leadId }) }),
  hangup: (callId: string, duration?: number) =>
    fetcher(`/api/telephony/calls/${callId}/outcome`, {
      method: 'POST',
      body: JSON.stringify({ status: 'atendida', duration: duration || 0 })
    }),
  transferCall: (callId: string, target: string, type: 'blind' | 'warm' = 'blind') =>
    fetcher(`/api/telephony/calls/${callId}/transfer`, {
      method: 'POST',
      body: JSON.stringify({ target, type })
    }),
  saveDisposition: (callId: string, status: string, notes?: string, duration?: number) =>
    fetcher(`/api/telephony/calls/${callId}/outcome`, {
      method: 'POST',
      body: JSON.stringify({ status, notes, duration })
    }),
  startPowerDialer: (leadIds: string[]) =>
    fetcher('/api/telephony/power-dialer/start', {
      method: 'POST',
      body: JSON.stringify({ leadIds })
    }),
  getPowerDialerSession: () => fetcher('/api/telephony/power-dialer/session'),
  nextPowerDialerLead: () => fetcher('/api/telephony/power-dialer/next', { method: 'POST' }),
  pausePowerDialer: () => fetcher('/api/telephony/power-dialer/pause', { method: 'POST' }),
  stopPowerDialer: () => fetcher('/api/telephony/power-dialer/stop', { method: 'POST' }),

  // AI & Knowledge Base (RAG)
  getAgent: () => fetcher('/api/ai/agent'),
  updateAgent: (data: any) => fetcher('/api/ai/agent', { method: 'PUT', body: JSON.stringify(data) }),
  getKnowledgeBase: () => fetcher('/api/ai/knowledge-base'),
  addKnowledgeBaseItem: (title: string, content: string, category = 'GERAL') =>
    fetcher('/api/ai/knowledge-base', {
      method: 'POST',
      body: JSON.stringify({ title, content, category })
    }),
  addDocument: (title: string, content: string, category = 'GERAL') =>
    fetcher('/api/ai/knowledge-base/ingest', {
      method: 'POST',
      body: JSON.stringify({ title, content, category })
    }),
  searchKnowledgeBase: (query: string, category?: string) =>
    fetcher('/api/ai/knowledge-base/search', { method: 'POST', body: JSON.stringify({ query, category }) }),
  transcribeAudio: (audioUrl?: string) =>
    fetcher('/api/ai/transcribe', {
      method: 'POST',
      body: JSON.stringify({ audioUrl })
    }),
  testAgentChat: (message: string, history: any[], leadContext?: any) =>
    fetcher('/api/ai/agent/test', {
      method: 'POST',
      body: JSON.stringify({ message, history, leadContext })
    }),

  // Settings & Integrations
  getSettings: () => fetcher('/api/settings'),
  updateSettings: (data: any) => fetcher('/api/settings', { method: 'PUT', body: JSON.stringify(data) }),
  testWhatsAppConnection: (phoneNumberId?: string, accessToken?: string) =>
    fetcher('/api/settings/whatsapp/test', { method: 'POST', body: JSON.stringify({ phoneNumberId, accessToken }) }),
  testAIConnection: (apiKey?: string, model?: string) =>
    fetcher('/api/settings/ai/test', { method: 'POST', body: JSON.stringify({ apiKey, model }) }),
  testTelephonyConnection: (provider?: string) =>
    fetcher('/api/settings/telephony/test', { method: 'POST', body: JSON.stringify({ provider }) }),

  // Team Management (Workspace Admin & Superadmin)
  getTeamMembers: () => fetcher('/api/team/users'),
  createTeamMember: (data: { name: string; email: string; password: string; role: string }) =>
    fetcher('/api/team/users', { method: 'POST', body: JSON.stringify(data) }),
  inviteTeamMember: (data: { email: string; name?: string; role: string }) =>
    fetcher('/api/team/invite', { method: 'POST', body: JSON.stringify(data) }),
  getPendingInvites: () => fetcher('/api/team/invites'),
  resendInvite: (id: string) => fetcher(`/api/team/invites/${id}/resend`, { method: 'POST' }),
  cancelInvite: (id: string) => fetcher(`/api/team/invites/${id}`, { method: 'DELETE' }),
  toggleUserStatus: (id: string, isActive: boolean) =>
    fetcher(`/api/team/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ isActive }) }),
  updateUserRole: (id: string, role: string) =>
    fetcher(`/api/team/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),
  reassignUserClients: (fromUserId: string, toUserId: string) =>
    fetcher(`/api/team/users/${fromUserId}/reassign`, { method: 'POST', body: JSON.stringify({ toUserId }) }),
  resetTeamMemberPassword: (id: string, newPassword: string) =>
    fetcher(`/api/team/users/${id}/reset-password`, { method: 'POST', body: JSON.stringify({ newPassword }) }),
  deleteTeamMember: (id: string) =>
    fetcher(`/api/team/users/${id}`, { method: 'DELETE' }),
  getPublicInvite: (token: string) => fetcher(`/api/team/public/invite/${token}`),
  acceptPublicInvite: (token: string, data: { name: string; password?: string }) =>
    fetcher(`/api/team/public/invite/${token}/accept`, { method: 'POST', body: JSON.stringify(data) }),

  // Super Admin Workspace Management (Superadmin role only)
  getWorkspaces: (params?: { page?: number; limit?: number; search?: string; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.search) query.append('search', params.search);
    if (params?.status) query.append('status', params.status);
    const qs = query.toString();
    return fetcher(qs ? `/api/admin/workspaces?${qs}` : '/api/admin/workspaces');
  },
  getAdminMetrics: () => fetcher('/api/admin/workspaces/metrics'),
  getWorkspaceById: (id: string) => fetcher(`/api/admin/workspaces/${id}`),
  createWorkspace: (data: { name: string; slug?: string; adminName: string; adminEmail: string; adminPassword: string }) =>
    fetcher('/api/admin/workspaces', { method: 'POST', body: JSON.stringify(data) }),
  updateWorkspaceStatus: (id: string, status: 'active' | 'suspended') =>
    fetcher(`/api/admin/workspaces/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  updateWorkspaceSubscription: (id: string, data: { subscriptionStatus?: string; subscriptionPlan?: string; trialEndsAt?: string | null; currentPeriodEnd?: string | null }) =>
    fetcher(`/api/admin/workspaces/${id}/subscription`, { method: 'PATCH', body: JSON.stringify(data) }),
  impersonateWorkspace: (id: string) =>
    fetcher(`/api/admin/workspaces/${id}/impersonate`, { method: 'POST' }),

  // Orders & Sales Pipeline
  getOrders: (params?: { status?: string; search?: string; leadId?: string; from?: string; to?: string }) => {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.search) query.append('search', params.search);
    if (params?.leadId) query.append('leadId', params.leadId);
    if (params?.from) query.append('from', params.from);
    if (params?.to) query.append('to', params.to);
    const qs = query.toString();
    return fetcher(qs ? `/api/orders?${qs}` : '/api/orders');
  },
  getOrderById: (id: string) => fetcher(`/api/orders/${id}`),
  createOrder: (data: any) => fetcher('/api/orders', { method: 'POST', body: JSON.stringify(data) }),
  updateOrderStatus: (id: string, status: string) =>
    fetcher(`/api/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  updateOrderDeliveryDate: (id: string, deliveryDate: string | null) =>
    fetcher(`/api/orders/${id}/delivery-date`, { method: 'PATCH', body: JSON.stringify({ deliveryDate }) }),
  syncContaAzulOrder: (id: string) =>
    fetcher(`/api/orders/${id}/sync-conta-azul`, { method: 'POST' }),

  // Inventory & Products
  getProducts: (params?: { search?: string; category?: string; activeOnly?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.category) query.append('category', params.category);
    if (params?.activeOnly) query.append('activeOnly', 'true');
    const qs = query.toString();
    return fetcher(qs ? `/api/inventory/products?${qs}` : '/api/inventory/products');
  },
  createProduct: (data: any) =>
    fetcher('/api/inventory/products', { method: 'POST', body: JSON.stringify(data) }),
  recordStockMovement: (data: any) =>
    fetcher('/api/inventory/movements', { method: 'POST', body: JSON.stringify(data) }),
  getStockMovements: (params?: { productId?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.productId) query.append('productId', params.productId);
    if (params?.limit) query.append('limit', params.limit.toString());
    const qs = query.toString();
    return fetcher(qs ? `/api/inventory/movements?${qs}` : '/api/inventory/movements');
  },

  // Recurrence & Churn Engine
  getChurnAlerts: () => fetcher('/api/churn/alerts'),
  generateReactivationPrompt: (leadId: string) =>
    fetcher('/api/churn/reactivation-prompt', { method: 'POST', body: JSON.stringify({ leadId }) }),

  // Conta Azul Integration Settings
  getContaAzulConfig: () => fetcher('/api/settings/integrations/conta-azul'),
  saveContaAzulConfig: (data: any) =>
    fetcher('/api/settings/integrations/conta-azul', { method: 'POST', body: JSON.stringify(data) }),
  testContaAzulConnection: (data: any) =>
    fetcher('/api/settings/integrations/conta-azul/test', { method: 'POST', body: JSON.stringify(data) })
};

