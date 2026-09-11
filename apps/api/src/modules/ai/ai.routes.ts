import { FastifyInstance } from 'fastify';
import { aiService } from './ai.service.js';
import { CreateKnowledgeBaseSchema, QueryKnowledgeBaseSchema } from '@omnicrm/shared';

export async function aiRoutes(app: FastifyInstance) {
  // Agent Config
  app.get('/agent', async () => {
    return aiService.getAgent();
  });

  app.put('/agent', async (req) => {
    const body = req.body as any;
    return aiService.updateAgent(body);
  });

  // Knowledge Base (RAG)
  app.get('/knowledge-base', async () => {
    return aiService.listKnowledgeBase();
  });

  app.post('/knowledge-base', async (req, reply) => {
    const parsed = CreateKnowledgeBaseSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.format() });
    }
    return await aiService.addKnowledgeBaseItem(
      parsed.data.title,
      parsed.data.content,
      parsed.data.category
    );
  });

  // Ingest Document/PDF/Text
  app.post('/knowledge-base/ingest', async (req, reply) => {
    const { title, content, category } = req.body as {
      title: string;
      content: string;
      category?: string;
    };
    if (!title || !content) {
      return reply.status(400).send({ error: 'Título e conteúdo são obrigatórios para ingestão de RAG.' });
    }
    return await aiService.addKnowledgeBaseItem(title, content, category || 'GERAL');
  });

  // Cosine Semantic Search
  app.post('/knowledge-base/search', async (req, reply) => {
    const parsed = QueryKnowledgeBaseSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.format() });
    }
    return await aiService.searchKnowledgeBase(parsed.data.query, parsed.data.category);
  });

  // Whisper Audio Transcription Endpoint
  app.post('/transcribe', async (req, reply) => {
    const { audioUrl } = req.body as { audioUrl?: string };
    const text = await aiService.transcribeAudio(audioUrl);
    return { success: true, text };
  });

  // Test Agent Chat Playground
  app.post('/agent/test', async (req) => {
    const { message, history, leadContext } = req.body as {
      message: string;
      history?: any[];
      leadContext?: any;
    };
    return await aiService.processChatWithAgent(message, history || [], leadContext);
  });
}
