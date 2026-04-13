import type { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { rateLimitConfig } from '@/config/rate-limits';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { listJobCardsController } from './v1-list-job-cards.controller';
import { createJobCardController } from './v1-create-job-card.controller';
import { startJobCardController } from './v1-start-job-card.controller';
import { completeJobCardController } from './v1-complete-job-card.controller';
import { holdJobCardController } from './v1-hold-job-card.controller';
import { reportProductionController } from './v1-report-production.controller';

export async function jobCardsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('PRODUCTION'));

  // Query routes com rate limit de consulta
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(listJobCardsController);
    },
    { prefix: '' },
  );

  // Mutation routes com rate limit de mutação
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(createJobCardController);
      mutationApp.register(startJobCardController);
      mutationApp.register(completeJobCardController);
      mutationApp.register(holdJobCardController);
      mutationApp.register(reportProductionController);
    },
    { prefix: '' },
  );
}
