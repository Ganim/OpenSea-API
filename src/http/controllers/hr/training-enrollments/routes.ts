import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { v1EnrollEmployeeController } from './v1-enroll-employee.controller';
import { v1CompleteEnrollmentController } from './v1-complete-enrollment.controller';
import { v1CancelEnrollmentController } from './v1-cancel-enrollment.controller';
import { v1ListTrainingEnrollmentsController } from './v1-list-training-enrollments.controller';

export async function trainingEnrollmentsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('HR'));

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(v1EnrollEmployeeController);
      mutationApp.register(v1CompleteEnrollmentController);
      mutationApp.register(v1CancelEnrollmentController);
    },
    { prefix: '' },
  );

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(v1ListTrainingEnrollmentsController);
    },
    { prefix: '' },
  );
}
