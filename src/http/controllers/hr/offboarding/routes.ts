import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { v1CompleteOffboardingItemController } from './v1-complete-offboarding-item.controller';
import { v1CreateOffboardingChecklistController } from './v1-create-offboarding-checklist.controller';
import { v1DeleteOffboardingChecklistController } from './v1-delete-offboarding-checklist.controller';
import { v1GetOffboardingByEmployeeController } from './v1-get-offboarding-by-employee.controller';
import { v1GetOffboardingChecklistController } from './v1-get-offboarding-checklist.controller';
import { v1ListOffboardingChecklistsController } from './v1-list-offboarding-checklists.controller';
import { v1UpdateOffboardingChecklistController } from './v1-update-offboarding-checklist.controller';

export async function offboardingRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('HR'));

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(v1CompleteOffboardingItemController);
      mutationApp.register(v1CreateOffboardingChecklistController);
      mutationApp.register(v1UpdateOffboardingChecklistController);
      mutationApp.register(v1DeleteOffboardingChecklistController);
    },
    { prefix: '' },
  );

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(v1GetOffboardingByEmployeeController);
      queryApp.register(v1ListOffboardingChecklistsController);
      queryApp.register(v1GetOffboardingChecklistController);
    },
    { prefix: '' },
  );
}
