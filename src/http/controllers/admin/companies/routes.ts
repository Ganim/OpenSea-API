import type { FastifyInstance } from 'fastify';
import { v1CreateCompanyAdminController } from './v1-create-company-controller';
import { v1DeleteCompanyAdminController } from './v1-delete-company-controller';
import { v1GetCompanyAdminController } from './v1-get-company-controller';
import { v1ListCompaniesAdminController } from './v1-list-companies-controller';
import { v1RestoreCompanyAdminController } from './v1-restore-company-controller';
import { v1UpdateCompanyAdminController } from './v1-update-company-controller';

export async function adminCompaniesRoutes(app: FastifyInstance) {
  await v1CreateCompanyAdminController(app);
  await v1GetCompanyAdminController(app);
  await v1ListCompaniesAdminController(app);
  await v1UpdateCompanyAdminController(app);
  await v1DeleteCompanyAdminController(app);
  await v1RestoreCompanyAdminController(app);
}
