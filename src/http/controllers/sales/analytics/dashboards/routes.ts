import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { listDashboardsController } from './v1-list-dashboards.controller';
import { createDashboardController } from './v1-create-dashboard.controller';

export async function analyticsDashboardsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('SALES'));

  await app.register(listDashboardsController);
  await app.register(createDashboardController);
}
