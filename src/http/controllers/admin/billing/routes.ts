import type { FastifyInstance } from 'fastify';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { generateBillingAdminController } from './v1-generate-billing.controller';
import { markBillingPaidAdminController } from './v1-mark-billing-paid.controller';
import { getTenantBillingAdminController } from './v1-get-tenant-billing.controller';
import { listBillingAdminController } from './v1-list-billing.controller';

export async function adminBillingRoutes(app: FastifyInstance) {
  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.admin);
      mutationApp.register(generateBillingAdminController);
      mutationApp.register(markBillingPaidAdminController);
    },
    { prefix: '' },
  );

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(listBillingAdminController);
      queryApp.register(getTenantBillingAdminController);
    },
    { prefix: '' },
  );
}
