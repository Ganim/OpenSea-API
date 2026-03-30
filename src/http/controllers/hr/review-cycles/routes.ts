import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { v1CreateReviewCycleController } from './v1-create-review-cycle.controller';
import { v1DeleteReviewCycleController } from './v1-delete-review-cycle.controller';
import { v1GetReviewCycleController } from './v1-get-review-cycle.controller';
import { v1ListReviewCyclesController } from './v1-list-review-cycles.controller';
import { v1UpdateReviewCycleController } from './v1-update-review-cycle.controller';
import { v1OpenReviewCycleController } from './v1-open-review-cycle.controller';
import { v1CloseReviewCycleController } from './v1-close-review-cycle.controller';

export async function reviewCyclesRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('HR'));

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(v1CreateReviewCycleController);
      mutationApp.register(v1UpdateReviewCycleController);
      mutationApp.register(v1DeleteReviewCycleController);
      mutationApp.register(v1OpenReviewCycleController);
      mutationApp.register(v1CloseReviewCycleController);
    },
    { prefix: '' },
  );

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(v1GetReviewCycleController);
      queryApp.register(v1ListReviewCyclesController);
    },
    { prefix: '' },
  );
}
