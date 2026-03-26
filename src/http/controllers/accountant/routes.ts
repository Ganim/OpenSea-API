import type { FastifyInstance } from 'fastify';

import { getAccountantDataController } from './v1-get-accountant-data.controller';
import { exportSpedController } from './v1-export-sped.controller';
import { getAccountantCategoriesController } from './v1-get-accountant-categories.controller';
import { getAccountantDreController } from './v1-get-accountant-dre.controller';

/**
 * Accountant portal routes.
 * These use token-based auth (verifyAccountant middleware) instead of JWT.
 * No module middleware needed — the accountant token already scopes to a tenant.
 */
export async function accountantPortalRoutes(app: FastifyInstance) {
  app.register(getAccountantDataController);
  app.register(exportSpedController);
  app.register(getAccountantCategoriesController);
  app.register(getAccountantDreController);
}
