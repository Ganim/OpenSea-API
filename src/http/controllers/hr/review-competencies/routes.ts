import type { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { rateLimitConfig } from '@/config/rate-limits';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { v1CreateReviewCompetencyController } from './v1-create-review-competency.controller';
import { v1ListReviewCompetenciesController } from './v1-list-review-competencies.controller';
import { v1UpdateReviewCompetencyController } from './v1-update-review-competency.controller';
import { v1DeleteReviewCompetencyController } from './v1-delete-review-competency.controller';
import { v1SeedDefaultReviewCompetenciesController } from './v1-seed-default-review-competencies.controller';

export async function reviewCompetenciesRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('HR'));

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(v1CreateReviewCompetencyController);
      mutationApp.register(v1UpdateReviewCompetencyController);
      mutationApp.register(v1DeleteReviewCompetencyController);
      mutationApp.register(v1SeedDefaultReviewCompetenciesController);
    },
    { prefix: '' },
  );

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(v1ListReviewCompetenciesController);
    },
    { prefix: '' },
  );
}
