import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { v1CreateTerminationController } from './v1-create-termination.controller';
import { v1CalculateTerminationController } from './v1-calculate-termination.controller';
import { v1GetTerminationController } from './v1-get-termination.controller';
import { v1ListTerminationsController } from './v1-list-terminations.controller';
import { v1GenerateTRCTPDFController } from './v1-generate-trct-pdf.controller';
import { v1UpdateTerminationController } from './v1-update-termination.controller';

export async function terminationsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('HR'));

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(v1CreateTerminationController);
      mutationApp.register(v1CalculateTerminationController);
      mutationApp.register(v1UpdateTerminationController);
    },
    { prefix: '' },
  );

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(v1GetTerminationController);
      queryApp.register(v1ListTerminationsController);
      queryApp.register(v1GenerateTRCTPDFController);
    },
    { prefix: '' },
  );
}
