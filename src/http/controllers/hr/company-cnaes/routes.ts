import type { FastifyInstance } from 'fastify';
import { createCompanyCnaeController } from './v1-create-company-cnae.controller';
import { deleteCompanyCnaeController } from './v1-delete-company-cnae.controller';
import { getCompanyCnaeController } from './v1-get-company-cnae.controller';
import { getPrimaryCompanyCnaeController } from './v1-get-primary-company-cnae.controller';
import { listCompanyCnaesController } from './v1-list-company-cnaes.controller';
import { updateCompanyCnaeController } from './v1-update-company-cnae.controller';

export async function companyCnaesRoutes(app: FastifyInstance) {
  await createCompanyCnaeController(app);
  await listCompanyCnaesController(app);
  await getCompanyCnaeController(app);
  await getPrimaryCompanyCnaeController(app);
  await updateCompanyCnaeController(app);
  await deleteCompanyCnaeController(app);
}
