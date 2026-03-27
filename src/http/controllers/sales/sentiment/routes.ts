import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { analyzeSentimentController } from './v1-analyze-sentiment.controller';
import { getConversationSentimentController } from './v1-get-conversation-sentiment.controller';

export async function sentimentRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('SALES'));

  await app.register(analyzeSentimentController);
  await app.register(getConversationSentimentController);
}
