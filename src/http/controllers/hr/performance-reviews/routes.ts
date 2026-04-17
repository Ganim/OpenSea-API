import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { v1CreateBulkReviewsController } from './v1-create-bulk-reviews.controller';
import { v1GetPerformanceReviewController } from './v1-get-performance-review.controller';
import { v1ListPerformanceReviewsController } from './v1-list-performance-reviews.controller';
import { v1SubmitSelfAssessmentController } from './v1-submit-self-assessment.controller';
import { v1SubmitManagerReviewController } from './v1-submit-manager-review.controller';
import { v1AcknowledgeReviewController } from './v1-acknowledge-review.controller';
import { v1AdvanceReviewStatusController } from './v1-advance-review-status.controller';

export async function performanceReviewsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('HR'));

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(v1CreateBulkReviewsController);
      mutationApp.register(v1SubmitSelfAssessmentController);
      mutationApp.register(v1SubmitManagerReviewController);
      mutationApp.register(v1AcknowledgeReviewController);
      mutationApp.register(v1AdvanceReviewStatusController);
    },
    { prefix: '' },
  );

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(v1GetPerformanceReviewController);
      queryApp.register(v1ListPerformanceReviewsController);
    },
    { prefix: '' },
  );
}
