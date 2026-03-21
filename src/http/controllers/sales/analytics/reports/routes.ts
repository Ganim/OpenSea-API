import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { createReportController } from './v1-create-report.controller';
import { listReportsController } from './v1-list-reports.controller';

export async function analyticsReportsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('SALES'));

  await app.register(createReportController);
  await app.register(listReportsController);
}
