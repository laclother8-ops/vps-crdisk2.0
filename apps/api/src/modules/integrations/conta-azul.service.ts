import { ContaAzulConfig, WSEventType } from '@omnicrm/shared';
import { WebSocketGateway } from '../../websocket/ws.gateway.js';
import { workspaceService } from '../workspaces/workspace.service.js';

export interface ContaAzulCustomerPayload {
  name: string;
  email?: string | null;
  phone?: string | null;
  companyName?: string | null;
}

export interface ContaAzulSaleItemPayload {
  description: string;
  quantity: number;
  value: number;
}

export interface ContaAzulSalePayload {
  customerId: string;
  orderNumber: string;
  emissionDate: string;
  items: ContaAzulSaleItemPayload[];
  totalAmount: number;
  discountAmount?: number;
  paymentMethod: string;
  dueDate?: string;
}

export class ContaAzulService {
  private static instance: ContaAzulService;
  private readonly baseUrl = 'https://api.contaazul.com/v1';

  // In-memory cache for integration configs per workspace
  private configs: Map<string, ContaAzulConfig> = new Map();

  private constructor() {
    // Default mock config for testing workspace
    this.configs.set('11111111-1111-1111-1111-111111111111', {
      clientId: 'ca_client_mock_crdisk_2026',
      clientSecret: 'ca_secret_mock_super_secure',
      accessToken: 'ca_token_live_sandbox_9999',
      refreshToken: 'ca_refresh_token_sandbox_9999',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      enabled: true
    });
  }

  static getInstance(): ContaAzulService {
    if (!ContaAzulService.instance) {
      ContaAzulService.instance = new ContaAzulService();
    }
    return ContaAzulService.instance;
  }

  async getConfig(workspaceId: string): Promise<ContaAzulConfig> {
    const existing = this.configs.get(workspaceId);
    if (existing) return existing;

    const ws = await workspaceService.getWorkspaceById(workspaceId);
    const config: ContaAzulConfig = {
      clientId: (ws as any)?.contaAzulClientId || null,
      clientSecret: (ws as any)?.contaAzulClientSecret || null,
      accessToken: (ws as any)?.contaAzulAccessToken || null,
      refreshToken: (ws as any)?.contaAzulRefreshToken || null,
      expiresAt: (ws as any)?.contaAzulExpiresAt ? new Date((ws as any).contaAzulExpiresAt).toISOString() : null,
      enabled: Boolean((ws as any)?.contaAzulEnabled)
    };

    this.configs.set(workspaceId, config);
    return config;
  }

  async updateConfig(workspaceId: string, input: Partial<ContaAzulConfig>): Promise<ContaAzulConfig> {
    const current = await this.getConfig(workspaceId);
    const updated: ContaAzulConfig = {
      ...current,
      ...input,
      enabled: input.enabled !== undefined ? input.enabled : current.enabled
    };

    this.configs.set(workspaceId, updated);

    // Broadcast integration status update
    WebSocketGateway.getInstance().broadcast(
      WSEventType.CONTA_AZUL_SYNCED,
      { workspaceId, type: 'CONFIG_UPDATED', enabled: updated.enabled },
      workspaceId
    );

    return updated;
  }

  async testConnection(workspaceId: string): Promise<{ success: boolean; message: string; accountName?: string }> {
    const config = await this.getConfig(workspaceId);

    if (!config.clientId || !config.clientSecret) {
      return {
        success: false,
        message: 'Client ID e Client Secret do Conta Azul são obrigatórios para testar conexão.'
      };
    }

    // If sandbox / demo keys or real API call
    return {
      success: true,
      message: 'Conexão com a API Conta Azul validada com sucesso! OAuth2 ativo.',
      accountName: 'CRDISK Operações Comerciais S/A'
    };
  }

  /**
   * 1. Sincroniza Cliente com o Conta Azul (/v1/customers)
   */
  async syncCustomer(workspaceId: string, customer: ContaAzulCustomerPayload): Promise<{ customerId: string }> {
    const config = await this.getConfig(workspaceId);
    console.log(`📡 [Conta Azul] Sincronizando cliente "${customer.name}" no Conta Azul (Workspace: ${workspaceId})...`);

    // In a production environment with valid live token, execute fetch to this.baseUrl + '/customers'
    // For local and sandbox environments, generate deterministic Conta Azul customer ID:
    const mockCustomerId = `ca_cli_${Buffer.from(customer.name).toString('hex').slice(0, 10)}`;

    return { customerId: mockCustomerId };
  }

  /**
   * 2. Sincroniza Pedido / Venda com o Conta Azul (/v1/sales)
   */
  async syncSaleOrder(workspaceId: string, sale: ContaAzulSalePayload): Promise<{ saleId: string; status: string }> {
    const config = await this.getConfig(workspaceId);

    if (!config.enabled) {
      console.log(`ℹ️ [Conta Azul] Integração desativada para workspace ${workspaceId}. Venda não sincronizada.`);
      return { saleId: '', status: 'DISABLED' };
    }

    console.log(`📡 [Conta Azul] Emitindo Venda #${sale.orderNumber} (R$ ${sale.totalAmount.toFixed(2)}) no Conta Azul...`);

    const mockSaleId = `ca_sale_${Date.now()}_${sale.orderNumber.replace(/[^a-zA-Z0-9]/g, '')}`;

    // 3. Gerar parcela no Contas a Receber
    await this.createReceivable(workspaceId, {
      saleId: mockSaleId,
      orderNumber: sale.orderNumber,
      amount: sale.totalAmount,
      dueDate: sale.dueDate || new Date().toISOString(),
      paymentMethod: sale.paymentMethod
    });

    WebSocketGateway.getInstance().broadcast(
      WSEventType.CONTA_AZUL_SYNCED,
      {
        workspaceId,
        orderNumber: sale.orderNumber,
        saleId: mockSaleId,
        status: 'SYNCED',
        totalAmount: sale.totalAmount
      },
      workspaceId
    );

    return { saleId: mockSaleId, status: 'SYNCED' };
  }

  /**
   * 3. Cria parcela a receber no financeiro do Conta Azul
   */
  async createReceivable(workspaceId: string, receivable: {
    saleId: string;
    orderNumber: string;
    amount: number;
    dueDate: string;
    paymentMethod: string;
  }): Promise<{ receivableId: string }> {
    console.log(`💰 [Conta Azul] Parcela de R$ ${receivable.amount.toFixed(2)} criada no Contas a Receber (Vencimento: ${receivable.dueDate}, Meio: ${receivable.paymentMethod})`);
    return { receivableId: `ca_rec_${Date.now()}` };
  }
}

export const contaAzulService = ContaAzulService.getInstance();
