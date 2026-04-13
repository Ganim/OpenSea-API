import type { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { rateLimitConfig } from '@/config/rate-limits';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { getTextileConfigController } from './v1-get-textile-config.controller';
import { generateCutPlanController } from './v1-generate-cut-plan.controller';
import { generateBundleTicketsController } from './v1-generate-bundle-tickets.controller';

export async function textileRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('PRODUCTION'));

  // Query routes com rate limit de consulta
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(getTextileConfigController);
    },
    { prefix: '' },
  );

  // Mutation routes com rate limit de mutação
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(generateCutPlanController);
      mutationApp.register(generateBundleTicketsController);
    },
    { prefix: '' },
  );
}
