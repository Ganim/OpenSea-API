import type { FastifyInstance } from 'fastify';
import { v1CheckCnpjController } from './v1-check-cnpj.controller';
import { v1CreateCompanyController } from './v1-create-company.controller';
import { v1DeleteCompanyController } from './v1-delete-company.controller';
import { v1GetCompanyByIdController } from './v1-get-company-by-id.controller';
import { v1ListCompaniesController } from './v1-list-companies.controller';
import { v1UpdateCompanyController } from './v1-update-company.controller';

export async function companiesRoutes(app: FastifyInstance) {
  await v1CreateCompanyController(app);
  await v1GetCompanyByIdController(app);
  await v1ListCompaniesController(app);
  await v1UpdateCompanyController(app);
  await v1DeleteCompanyController(app);
  await v1CheckCnpjController(app);
}
