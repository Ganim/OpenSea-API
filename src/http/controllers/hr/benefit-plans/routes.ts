import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { v1CreateBenefitPlanController } from './v1-create-benefit-plan.controller';
import { v1DeleteBenefitPlanController } from './v1-delete-benefit-plan.controller';
import { v1GetBenefitPlanController } from './v1-get-benefit-plan.controller';
import { v1ListBenefitPlansController } from './v1-list-benefit-plans.controller';
import { v1UpdateBenefitPlanController } from './v1-update-benefit-plan.controller';

export async function benefitPlansRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('HR'));

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(v1CreateBenefitPlanController);
      mutationApp.register(v1UpdateBenefitPlanController);
      mutationApp.register(v1DeleteBenefitPlanController);
    },
    { prefix: '' },
  );

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(v1GetBenefitPlanController);
      queryApp.register(v1ListBenefitPlansController);
    },
    { prefix: '' },
  );
}
