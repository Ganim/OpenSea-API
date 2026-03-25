import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { v1GetPunchConfigController } from './v1-get-punch-config.controller';
import { v1UpdatePunchConfigController } from './v1-update-punch-config.controller';
import { v1GenerateQrPayloadController } from './v1-generate-qr-payload.controller';

export async function punchConfigRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('HR'));

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(v1GetPunchConfigController);
    },
    { prefix: '' },
  );

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(v1UpdatePunchConfigController);
      mutationApp.register(v1GenerateQrPayloadController);
    },
    { prefix: '' },
  );
}
