import type { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { rateLimitConfig } from '@/config/rate-limits';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { listInspectionPlansController } from './v1-list-inspection-plans.controller';
import { createInspectionPlanController } from './v1-create-inspection-plan.controller';
import { updateInspectionPlanController } from './v1-update-inspection-plan.controller';
import { deleteInspectionPlanController } from './v1-delete-inspection-plan.controller';

export async function inspectionPlansRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('PRODUCTION'));

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(listInspectionPlansController);
    },
    { prefix: '' },
  );

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(createInspectionPlanController);
      mutationApp.register(updateInspectionPlanController);
      mutationApp.register(deleteInspectionPlanController);
    },
    { prefix: '' },
  );
}
