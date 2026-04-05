import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import type { FastifyInstance } from 'fastify';
import { v1PreviewReceiptController } from './v1-preview-receipt.controller';
import { v1QueueReceiptController } from './v1-queue-receipt.controller';

export async function printingRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('SALES'));

  await app.register(v1QueueReceiptController);
  await app.register(v1PreviewReceiptController);
}
