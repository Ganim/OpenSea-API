import type { FastifyInstance } from 'fastify';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { v1AddTenantSubscriptionController } from './v1-add-tenant-subscription.controller';
import { v1ApplyTenantDiscountController } from './v1-apply-tenant-discount.controller';
import { v1GetTenantConsumptionController } from './v1-get-tenant-consumption.controller';
import { v1GetTenantOverviewController } from './v1-get-tenant-overview.controller';
import { v1GetTenantSubscriptionController } from './v1-get-tenant-subscription.controller';
import { v1OverrideTenantLimitController } from './v1-override-tenant-limit.controller';
import { v1RemoveTenantSubscriptionController } from './v1-remove-tenant-subscription.controller';

export async function adminTenantSubscriptionsRoutes(app: FastifyInstance) {
  // Tenant subscription mutation routes
  app.register(
    async (adminApp) => {
      adminApp.register(rateLimit, rateLimitConfig.admin);
      adminApp.register(v1AddTenantSubscriptionController);
      adminApp.register(v1RemoveTenantSubscriptionController);
      adminApp.register(v1ApplyTenantDiscountController);
      adminApp.register(v1OverrideTenantLimitController);
    },
    { prefix: '' },
  );

  // Tenant subscription query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(v1GetTenantSubscriptionController);
      queryApp.register(v1GetTenantConsumptionController);
      queryApp.register(v1GetTenantOverviewController);
    },
    { prefix: '' },
  );
}
