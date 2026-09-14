import { ChurnRiskTier, CustomerRecurrence } from '@omnicrm/shared';
import { crmService } from '../crm/crm.service.js';
import { orderService } from '../orders/order.service.js';

export class ChurnService {
  private static instance: ChurnService;

  private constructor() {}

  static getInstance(): ChurnService {
    if (!ChurnService.instance) {
      ChurnService.instance = new ChurnService();
    }
    return ChurnService.instance;
  }

  /**
   * Calcula as métricas de inatividade e risco de churn para todos os clientes
   */
  async getCustomerRecurrenceList(workspaceId: string, riskTierFilter?: ChurnRiskTier): Promise<{
    summary: { total: number; normal: number; alert: number; critical: number };
    customers: CustomerRecurrence[];
  }> {
    const leadsResponse = await crmService.listLeads({ workspaceId, limit: 100 } as any);
    const leads = leadsResponse.data || [];
    const orders = await orderService.listOrders(workspaceId);

    const now = Date.now();
    const customers: CustomerRecurrence[] = [];

    let normalCount = 0;
    let alertCount = 0;
    let criticalCount = 0;

    for (const lead of leads) {
      // Find latest order for this customer
      const clientOrders = orders.filter(o => o.contactId === lead.id);
      const latestOrder = clientOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

      let lastOrderAtStr = (lead as any).lastOrderAt || (latestOrder ? new Date(latestOrder.createdAt).toISOString() : null);
      let days = 99; // Default critical if never ordered

      if (lastOrderAtStr) {
        const diffMs = now - new Date(lastOrderAtStr).getTime();
        days = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      }

      let riskTier: ChurnRiskTier = 'NORMAL';
      if (days > 60 || !lastOrderAtStr) {
        riskTier = 'CRITICAL';
        criticalCount++;
      } else if (days > 30) {
        riskTier = 'ALERT';
        alertCount++;
      } else {
        riskTier = 'NORMAL';
        normalCount++;
      }

      // Calculate LTV
      const totalOrdersCount = clientOrders.length || (lead as any).totalOrdersCount || 0;
      const ltv = clientOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0) || Number((lead as any).ltv || 0);

      const customerItem: CustomerRecurrence = {
        id: lead.id,
        name: lead.name,
        company: lead.company || null,
        phone: lead.phone,
        email: lead.email || null,
        lastOrderAt: lastOrderAtStr,
        totalOrdersCount,
        ltv,
        inactivityDays: days,
        riskTier,
        lastOrderNumber: latestOrder?.orderNumber || null,
        lastOrderAmount: latestOrder?.totalAmount || null
      };

      if (!riskTierFilter || customerItem.riskTier === riskTierFilter) {
        customers.push(customerItem);
      }
    }

    // Sort by inactivity days descending
    customers.sort((a, b) => b.inactivityDays - a.inactivityDays);

    return {
      summary: {
        total: leads.length,
        normal: normalCount,
        alert: alertCount,
        critical: criticalCount
      },
      customers
    };
  }

  /**
   * Gera texto de reativação pré-configurado da Sofia IA para o cliente
   */
  generateReactivationPrompt(customer: CustomerRecurrence): string {
    const firstName = customer.name.split(' ')[0];
    const company = customer.company ? ` na ${customer.company}` : '';
    
    if (customer.inactivityDays > 60) {
      return `Olá ${firstName}! Tudo bem com você e sua equipe${company}? Notamos que faz mais de ${customer.inactivityDays} dias desde o seu último pedido (${customer.lastOrderNumber || 'conosco'}). Preparamos uma condição comercial especial com desconto exclusivo de reposição para este mês. Podemos conversar 5 minutos hoje?`;
    }

    return `Olá ${firstName}! Como estão as coisas${company}? Passando para acompanhar o andamento da sua operação e verificar se você precisa repor seu estoque ou renovar licenças. Conseguimos entregar ainda esta semana!`;
  }
}

export const churnService = ChurnService.getInstance();
