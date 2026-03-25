import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';

import { createBudgetController } from './v1-create-budget.controller';
import { listBudgetsController } from './v1-list-budgets.controller';
import { updateBudgetController } from './v1-update-budget.controller';
import { deleteBudgetController } from './v1-delete-budget.controller';
import { bulkCreateBudgetsController } from './v1-bulk-create-budgets.controller';
import { budgetVsActualController } from './v1-budget-vs-actual.controller';

export async function financeBudgetRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('FINANCE'));

  app.register(bulkCreateBudgetsController);
  app.register(createBudgetController);
  app.register(listBudgetsController);
  app.register(updateBudgetController);
  app.register(deleteBudgetController);
  app.register(budgetVsActualController);
}
