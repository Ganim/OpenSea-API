import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';

import { createBudgetController } from './v1-create-budget.controller';
import { listBudgetsController } from './v1-list-budgets.controller';
import { updateBudgetController } from './v1-update-budget.controller';
import { deleteBudgetController } from './v1-delete-budget.controller';
import { bulkCreateBudgetsController } from './v1-bulk-create-budgets.controller';
import { budgetVsActualController } from './v1-budget-vs-actual.controller';

export async function financeBudgetRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('FINANCE'));

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(listBudgetsController);
      queryApp.register(budgetVsActualController);
    },
    { prefix: '' },
  );

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.financeMutation);
      mutationApp.register(createBudgetController);
      mutationApp.register(updateBudgetController);
      mutationApp.register(deleteBudgetController);
    },
    { prefix: '' },
  );

  // Bulk operations
  app.register(
    async (bulkApp) => {
      bulkApp.register(rateLimit, rateLimitConfig.financeBulk);
      bulkApp.register(bulkCreateBudgetsController);
    },
    { prefix: '' },
  );
}
