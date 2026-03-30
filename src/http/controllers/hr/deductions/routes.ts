import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { v1CreateDeductionController } from './v1-create-deduction.controller';
import { v1DeleteDeductionController } from './v1-delete-deduction.controller';
import { v1GetDeductionController } from './v1-get-deduction.controller';
import { v1ListDeductionsController } from './v1-list-deductions.controller';
import { v1UpdateDeductionController } from './v1-update-deduction.controller';

export async function deductionsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('HR'));

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(v1CreateDeductionController);
      mutationApp.register(v1UpdateDeductionController);
      mutationApp.register(v1DeleteDeductionController);
    },
    { prefix: '' },
  );

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(v1GetDeductionController);
      queryApp.register(v1ListDeductionsController);
    },
    { prefix: '' },
  );
}
