import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';

import { createCostCenterController } from './v1-create-cost-center.controller';
import { deleteCostCenterController } from './v1-delete-cost-center.controller';
import { getCostCenterByIdController } from './v1-get-cost-center-by-id.controller';
import { listCostCentersController } from './v1-list-cost-centers.controller';
import { updateCostCenterController } from './v1-update-cost-center.controller';

export async function costCentersRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('FINANCE'));

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(getCostCenterByIdController);
      queryApp.register(listCostCentersController);
    },
    { prefix: '' },
  );

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.financeMutation);
      mutationApp.register(createCostCenterController);
      mutationApp.register(updateCostCenterController);
      mutationApp.register(deleteCostCenterController);
    },
    { prefix: '' },
  );
}
