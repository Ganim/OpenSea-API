import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';

import { createPixChargeBankingController } from './v1-create-pix-charge.controller';
import { getPixChargeController } from './v1-get-pix-charge.controller';

export async function pixRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('FINANCE'));

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(getPixChargeController);
    },
    { prefix: '' },
  );

  // Integration routes — PIX charge creation triggers external bank call
  app.register(
    async (integrationApp) => {
      integrationApp.register(rateLimit, rateLimitConfig.financeWebhook);
      integrationApp.register(createPixChargeBankingController);
    },
    { prefix: '' },
  );
}
