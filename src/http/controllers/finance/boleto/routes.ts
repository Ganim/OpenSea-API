import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';

import { emitBoletoController } from './v1-emit-boleto.controller';
import { cancelBoletoController } from './v1-cancel-boleto.controller';
import { getBoletoController } from './v1-get-boleto.controller';

export async function boletoRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('FINANCE'));

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(getBoletoController);
    },
    { prefix: '' },
  );

  // Integration routes — emit and cancel trigger external bank calls
  app.register(
    async (integrationApp) => {
      integrationApp.register(rateLimit, rateLimitConfig.financeWebhook);
      integrationApp.register(emitBoletoController);
      integrationApp.register(cancelBoletoController);
    },
    { prefix: '' },
  );
}
