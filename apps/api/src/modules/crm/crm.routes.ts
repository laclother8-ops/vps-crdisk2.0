import { FastifyInstance } from 'fastify';
import { crmService } from './crm.service.js';
import { CreateLeadSchema, FunnelStage, LeadContactStatus, UpdateContactStatusSchema, UpdateFunnelStageSchema, UpdateLeadSchema } from '@omnicrm/shared';

export async function crmRoutes(app: FastifyInstance) {
  // 1. Paginated Leads List with Filters
  app.get('/leads', async (req) => {
    const query = req.query as any;
    return await crmService.listLeads({
      page: query.page ? parseInt(query.page) : 1,
      limit: query.limit ? parseInt(query.limit) : 20,
      search: query.search,
      status: query.status as LeadContactStatus,
      funnelStage: query.funnelStage as FunnelStage,
      tag: query.tag,
      assignedUserId: query.assignedUserId,
      workspaceId: (req.headers['x-workspace-id'] as string) || query.workspaceId
    });
  });

  // 2. Get Single Lead
  app.get('/leads/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const lead = await crmService.getLeadById(id);
    if (!lead) {
      return reply.status(404).send({ error: 'Lead não encontrado' });
    }
    return lead;
  });

  // 3. Create Lead
  app.post('/leads', async (req, reply) => {
    const parsed = CreateLeadSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.format() });
    }
    return await crmService.createLead(parsed.data);
  });

  // 4. Update Lead (Full/Partial)
  app.patch('/leads/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const parsed = UpdateLeadSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.format() });
    }
    const updated = await crmService.updateLead(id, parsed.data);
    if (!updated) {
      return reply.status(404).send({ error: 'Lead não encontrado' });
    }
    return updated;
  });

  // 5. Delete Lead
  app.delete('/leads/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const deleted = await crmService.deleteLead(id);
    if (!deleted) {
      return reply.status(404).send({ error: 'Lead não encontrado' });
    }
    return { success: true, message: 'Lead removido com sucesso' };
  });

  // 6. Update Funnel Stage
  app.patch('/leads/:id/stage', async (req, reply) => {
    const { id } = req.params as { id: string };
    const parsed = UpdateFunnelStageSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.format() });
    }
    const updated = await crmService.updateFunnelStage(id, parsed.data.funnelStage);
    if (!updated) {
      return reply.status(404).send({ error: 'Lead não encontrado' });
    }
    return updated;
  });

  // 7. Update Contact Status & Opt Out
  app.patch('/leads/:id/status', async (req, reply) => {
    const { id } = req.params as { id: string };
    const parsed = UpdateContactStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.format() });
    }
    const updated = await crmService.updateContactStatus(
      id, 
      parsed.data.status, 
      parsed.data.optOut, 
      parsed.data.lastCallStatus
    );
    if (!updated) {
      return reply.status(404).send({ error: 'Lead não encontrado' });
    }
    return updated;
  });

  // 8. Followup Queue
  app.get('/followup-queue', async () => {
    return await crmService.listFollowupQueue();
  });

  // 9. Trigger Background Followup Worker Process Now
  app.post('/followup-queue/process-now', async () => {
    const { followupWorker } = await import('./followup.worker.js');
    const result = await followupWorker.processPendingQueue();
    return {
      success: true,
      message: 'Fila de follow-up processada com sucesso.',
      stats: result
    };
  });

  // 10. Cancel Followup Queue Item
  app.post('/followup-queue/:id/cancel', async (req, reply) => {
    const { id } = req.params as { id: string };
    const { reason } = (req.body as any) || {};
    const updated = await crmService.updateFollowupStatus(
      id, 
      'cancelado' as any, 
      reason || 'Cancelado manualmente pelo operador'
    );
    if (!updated) {
      return reply.status(404).send({ error: 'Item de follow-up não encontrado' });
    }
    return updated;
  });

  // 11. Enqueue Manual Followup
  app.post('/followup-queue/enqueue', async (req, reply) => {
    const { leadId, triggerType = 'MANUAL', delayMinutes = 15 } = req.body as any;
    if (!leadId) {
      return reply.status(400).send({ error: 'leadId é obrigatório' });
    }
    const item = await crmService.enqueueFollowup(leadId, triggerType, delayMinutes);
    return item;
  });

  // 12. Get Unified Lead Timeline (Calls, Messages, Notes)
  app.get('/leads/:id/timeline', async (req, reply) => {
    const { id } = req.params as { id: string };
    const timeline = await crmService.getLeadTimeline(id);
    return reply.send({ timeline, total: timeline.length });
  });

  // 13. Add Internal Note to Lead
  app.post('/leads/:id/notes', async (req, reply) => {
    const { id } = req.params as { id: string };
    const { content, authorName = 'Atendente' } = req.body as any || {};
    if (!content || !content.trim()) {
      return reply.status(400).send({ error: 'Conteúdo da nota não pode ser vazio.' });
    }
    const note = await crmService.addLeadNote(id, content.trim(), authorName);
    return reply.status(201).send(note);
  });
}
