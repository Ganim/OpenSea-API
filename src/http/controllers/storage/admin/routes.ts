import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { migrateFinanceAttachmentsController } from './v1-migrate-finance-attachments.controller';

export async function storageAdminRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('STORAGE'));

  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(migrateFinanceAttachmentsController);
    },
    { prefix: '' },
  );
}
