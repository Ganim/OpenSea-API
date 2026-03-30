import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';

import { createChartOfAccountController } from './v1-create-chart-of-account.controller';
import { deleteChartOfAccountController } from './v1-delete-chart-of-account.controller';
import { getChartOfAccountByIdController } from './v1-get-chart-of-account-by-id.controller';
import { listChartOfAccountsController } from './v1-list-chart-of-accounts.controller';
import { updateChartOfAccountController } from './v1-update-chart-of-account.controller';

export async function chartOfAccountsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('FINANCE'));

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(getChartOfAccountByIdController);
      queryApp.register(listChartOfAccountsController);
    },
    { prefix: '' },
  );

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.financeMutation);
      mutationApp.register(createChartOfAccountController);
      mutationApp.register(updateChartOfAccountController);
      mutationApp.register(deleteChartOfAccountController);
    },
    { prefix: '' },
  );
}
