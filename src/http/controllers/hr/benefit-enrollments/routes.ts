import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { v1BulkEnrollController } from './v1-bulk-enroll.controller';
import { v1CancelEnrollmentController } from './v1-cancel-enrollment.controller';
import { v1EnrollEmployeeController } from './v1-enroll-employee.controller';
import { v1ListEnrollmentsController } from './v1-list-enrollments.controller';
import { v1UpdateEnrollmentController } from './v1-update-enrollment.controller';

export async function benefitEnrollmentsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('HR'));

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(v1EnrollEmployeeController);
      mutationApp.register(v1BulkEnrollController);
      mutationApp.register(v1UpdateEnrollmentController);
      mutationApp.register(v1CancelEnrollmentController);
    },
    { prefix: '' },
  );

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(v1ListEnrollmentsController);
    },
    { prefix: '' },
  );
}
