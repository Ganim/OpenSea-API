import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { listMsgTemplatesController } from './v1-list-msg-templates.controller';

export async function msgTemplatesRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('SALES'));

  await app.register(listMsgTemplatesController);
}
