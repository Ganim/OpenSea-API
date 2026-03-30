import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { v1AssignPPEController } from './v1-assign-ppe.controller';
import { v1ReturnPPEController } from './v1-return-ppe.controller';
import { v1ListPPEAssignmentsController } from './v1-list-ppe-assignments.controller';
import { v1ListExpiringAssignmentsController } from './v1-list-expiring-assignments.controller';

export async function ppeAssignmentsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('HR'));

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(v1AssignPPEController);
      mutationApp.register(v1ReturnPPEController);
    },
    { prefix: '' },
  );

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(v1ListPPEAssignmentsController);
      queryApp.register(v1ListExpiringAssignmentsController);
    },
    { prefix: '' },
  );
}
