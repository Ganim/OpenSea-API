import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { getChatbotConfigController } from './v1-get-chatbot-config.controller';
import { updateChatbotConfigController } from './v1-update-chatbot-config.controller';

export async function chatbotRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('SALES'));

  await app.register(getChatbotConfigController);
  await app.register(updateChatbotConfigController);
}
