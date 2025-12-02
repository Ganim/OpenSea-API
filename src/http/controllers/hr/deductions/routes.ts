import { app } from '@/app';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { createDeductionController } from './v1-create-deduction.controller';
import { deleteDeductionController } from './v1-delete-deduction.controller';
import { getDeductionController } from './v1-get-deduction.controller';
import { listDeductionsController } from './v1-list-deductions.controller';

export async function deductionsRoutes() {
  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(createDeductionController);
      mutationApp.register(deleteDeductionController);
    },
    { prefix: '' },
  );

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(getDeductionController);
      queryApp.register(listDeductionsController);
    },
    { prefix: '' },
  );
}
