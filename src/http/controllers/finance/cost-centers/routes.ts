import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';

import { createCostCenterController } from './v1-create-cost-center.controller';
import { deleteCostCenterController } from './v1-delete-cost-center.controller';
import { getCostCenterByIdController } from './v1-get-cost-center-by-id.controller';
import { listCostCentersController } from './v1-list-cost-centers.controller';
import { updateCostCenterController } from './v1-update-cost-center.controller';

export async function costCentersRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('FINANCE'));

  app.register(getCostCenterByIdController);
  app.register(listCostCentersController);
  app.register(createCostCenterController);
  app.register(updateCostCenterController);
  app.register(deleteCostCenterController);
}
