import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';

import { exportAccountingController } from './v1-export-accounting.controller';
import { exportSpedEfdController } from './v1-export-sped-efd.controller';

export async function financeExportRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('FINANCE'));

  app.register(exportAccountingController);
  app.register(exportSpedEfdController);
}
