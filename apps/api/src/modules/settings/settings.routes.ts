import { FastifyInstance } from 'fastify';
import { settingsService } from './settings.service.js';

export async function settingsRoutes(app: FastifyInstance) {
  // 1. Get current system settings
  app.get('/', async () => {
    return settingsService.getSettings();
  });

  // 2. Update system settings
  app.put('/', async (req) => {
    const body = req.body as any;
    return settingsService.updateSettings(body);
  });

  // 3. Test WhatsApp Cloud API Connection
  app.post('/whatsapp/test', async (req) => {
    const { phoneNumberId, accessToken } = (req.body as any) || {};
    return await settingsService.testWhatsAppConnection(phoneNumberId, accessToken);
  });

  // 4. Test AI Provider Connection
  app.post('/ai/test', async (req) => {
    const { apiKey, model } = (req.body as any) || {};
    return await settingsService.testAIConnection(apiKey, model);
  });

  // 5. Test Telephony Provider Connection
  app.post('/telephony/test', async (req) => {
    const { provider } = (req.body as any) || {};
    return await settingsService.testTelephonyConnection(provider);
  });
}
