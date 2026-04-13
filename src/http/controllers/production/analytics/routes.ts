import type { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { rateLimitConfig } from '@/config/rate-limits';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { getProductionDashboardController } from './v1-get-production-dashboard.controller';

export async function productionAnalyticsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('PRODUCTION'));

  // Query routes com rate limit de consulta
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(getProductionDashboardController);
    },
    { prefix: '' },
  );
}
