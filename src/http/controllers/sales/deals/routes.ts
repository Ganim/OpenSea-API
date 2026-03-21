import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { changeDealStageController } from './v1-change-deal-stage.controller';
import { createDealController } from './v1-create-deal.controller';
import { deleteDealController } from './v1-delete-deal.controller';
import { getDealByIdController } from './v1-get-deal-by-id.controller';
import { listDealsController } from './v1-list-deals.controller';
import { updateDealController } from './v1-update-deal.controller';

export async function dealsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('SALES'));

  await app.register(getDealByIdController);
  await app.register(listDealsController);
  await app.register(createDealController);
  await app.register(updateDealController);
  await app.register(deleteDealController);
  await app.register(changeDealStageController);
}
