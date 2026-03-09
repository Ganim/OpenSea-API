import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { v1CreateCompanyStakeholder } from './v1-create-company-stakeholder.controller';
import { v1DeleteCompanyStakeholder } from './v1-delete-company-stakeholder.controller';
import { v1GetCompanyStakeholders } from './v1-get-company-stakeholders.controller';
import { v1UpdateCompanyStakeholder } from './v1-update-company-stakeholder.controller';

export async function companyStakeholderRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('HR'));

  await v1CreateCompanyStakeholder(app);
  await v1GetCompanyStakeholders(app);
  await v1UpdateCompanyStakeholder(app);
  await v1DeleteCompanyStakeholder(app);
}
