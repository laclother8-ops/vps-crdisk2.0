import { FastifyInstance } from 'fastify';
import { telephonyService } from './telephony.service.js';
import { RegisterCallOutcomeSchema } from '@omnicrm/shared';

export async function telephonyRoutes(app: FastifyInstance) {
  // WebRTC Client Token
  app.get('/token', async (req) => {
    const query = req.query as { identity?: string };
    return telephonyService.getWebRTCToken(query.identity);
  });

  // Call Logs
  app.get('/calls', async () => {
    return await telephonyService.listCalls();
  });

  // Active Call
  app.get('/calls/active', async () => {
    return telephonyService.getActiveCall();
  });

  // Initiate Outbound Call
  app.post('/calls/dial', async (req) => {
    const { leadId } = req.body as { leadId: string };
    return await telephonyService.initiateCall(leadId);
  });

  // Transfer Call
  app.post('/calls/:id/transfer', async (req, reply) => {
    const { id } = req.params as { id: string };
    const { target, type } = req.body as { target: string; type?: 'blind' | 'warm' };
    return await telephonyService.transferCall(id, target, type);
  });

  // Register Call Outcome (Disposition)
  app.post('/calls/:id/outcome', async (req, reply) => {
    const { id } = req.params as { id: string };
    const { status, duration, notes, recordingUrl } = req.body as any;
    return await telephonyService.registerCallOutcome(id, status, duration, notes, recordingUrl);
  });

  // --- Power Dialer Routes ---

  // Start Power Dialer Session
  app.post('/power-dialer/start', async (req, reply) => {
    const { leadIds } = req.body as { leadIds: string[] };
    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return reply.status(400).send({ error: 'Nenhum lead selecionado para a fila de discagem.' });
    }
    return await telephonyService.startPowerDialer(leadIds);
  });

  // Get Current Session
  app.get('/power-dialer/session', async () => {
    return telephonyService.getPowerDialerSession();
  });

  // Next Lead in Power Dialer
  app.post('/power-dialer/next', async () => {
    return await telephonyService.nextPowerDialerLead();
  });

  // Pause Power Dialer
  app.post('/power-dialer/pause', async () => {
    return telephonyService.pausePowerDialer();
  });

  // Stop Power Dialer
  app.post('/power-dialer/stop', async () => {
    telephonyService.stopPowerDialer();
    return { success: true, message: 'Sessão de discagem encerrada.' };
  });
}
