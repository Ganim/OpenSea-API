import type { FastifyInstance } from 'fastify';
import { createCompanyFiscalSettingsController } from './v1-create-company-fiscal-settings.controller';
import { deleteCompanyFiscalSettingsController } from './v1-delete-company-fiscal-settings.controller';
import { getCompanyFiscalSettingsController } from './v1-get-company-fiscal-settings.controller';
import { updateCompanyFiscalSettingsController } from './v1-update-company-fiscal-settings.controller';

export async function companyFiscalSettingsRoutes(app: FastifyInstance) {
  await createCompanyFiscalSettingsController(app);
  await getCompanyFiscalSettingsController(app);
  await updateCompanyFiscalSettingsController(app);
  await deleteCompanyFiscalSettingsController(app);
}
