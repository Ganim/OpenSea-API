import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { v1ListFinanceCompaniesController } from './v1-list-companies.controller';
import { v1GetFinanceCompanyByIdController } from './v1-get-company-by-id.controller';

export async function financeCompaniesRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('FINANCE'));

  await v1ListFinanceCompaniesController(app);
  await v1GetFinanceCompanyByIdController(app);
}
