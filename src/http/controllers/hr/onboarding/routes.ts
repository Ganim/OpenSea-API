import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { v1GetMyOnboardingController } from './v1-get-my-onboarding.controller';
import { v1CompleteOnboardingItemController } from './v1-complete-onboarding-item.controller';
import { v1ListOnboardingChecklistsController } from './v1-list-onboarding-checklists.controller';
import { v1GetOnboardingChecklistController } from './v1-get-onboarding-checklist.controller';
import { v1CreateOnboardingChecklistController } from './v1-create-onboarding-checklist.controller';
import { v1UpdateOnboardingChecklistController } from './v1-update-onboarding-checklist.controller';
import { v1DeleteOnboardingChecklistController } from './v1-delete-onboarding-checklist.controller';

export async function onboardingRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('HR'));

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(v1CompleteOnboardingItemController);
      mutationApp.register(v1CreateOnboardingChecklistController);
      mutationApp.register(v1UpdateOnboardingChecklistController);
      mutationApp.register(v1DeleteOnboardingChecklistController);
    },
    { prefix: '' },
  );

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(v1GetMyOnboardingController);
      queryApp.register(v1ListOnboardingChecklistsController);
      queryApp.register(v1GetOnboardingChecklistController);
    },
    { prefix: '' },
  );
}
