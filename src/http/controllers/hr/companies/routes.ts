import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { v1GetCompanyByIdController } from './v1-get-company-by-id.controller';
import { v1ListCompaniesController } from './v1-list-companies.controller';

export async function companiesRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('HR'));

  await v1GetCompanyByIdController(app);
  await v1ListCompaniesController(app);
}
