import type { FastifyInstance } from 'fastify';
import { v1CreateCompanyAdminController } from './v1-create-company-controller';
import { v1DeleteCompanyAdminController } from './v1-delete-company-controller';
import { v1GetCompanyAdminController } from './v1-get-company-controller';
import { v1ListCompaniesAdminController } from './v1-list-companies-controller';
import { v1RestoreCompanyAdminController } from './v1-restore-company-controller';
import { v1UpdateCompanyAdminController } from './v1-update-company-controller';
import { v1CheckCnpjController } from './v1-check-cnpj.controller';
import { adminCompanyAddressesRoutes } from './addresses/routes';
import { adminCompanyCnaesRoutes } from './cnaes/routes';
import { adminCompanyFiscalSettingsRoutes } from './fiscal-settings/routes';
import { adminCompanyDocumentsRoutes } from './documents/routes';
import { adminCompanyStakeholderRoutes } from './stakeholders/routes';

export async function adminCompaniesRoutes(app: FastifyInstance) {
  await v1CreateCompanyAdminController(app);
  await v1GetCompanyAdminController(app);
  await v1ListCompaniesAdminController(app);
  await v1UpdateCompanyAdminController(app);
  await v1DeleteCompanyAdminController(app);
  await v1RestoreCompanyAdminController(app);
  await v1CheckCnpjController(app);

  // Sub-resource routes
  await app.register(adminCompanyAddressesRoutes);
  await app.register(adminCompanyCnaesRoutes);
  await app.register(adminCompanyFiscalSettingsRoutes);
  await app.register(adminCompanyDocumentsRoutes);
  await app.register(adminCompanyStakeholderRoutes);
}
