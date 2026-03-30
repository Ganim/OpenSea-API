import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { v1ListFinanceCompaniesController } from './v1-list-companies.controller';
import { v1GetFinanceCompanyByIdController } from './v1-get-company-by-id.controller';

export async function financeCompaniesRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('FINANCE'));

  // Query routes only
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      await v1ListFinanceCompaniesController(queryApp);
      await v1GetFinanceCompanyByIdController(queryApp);
    },
    { prefix: '' },
  );
}
