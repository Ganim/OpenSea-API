import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';

import { exportAccountingController } from './v1-export-accounting.controller';
import { exportSpedEcdController } from './v1-export-sped-ecd.controller';
import { exportSpedEfdController } from './v1-export-sped-efd.controller';

export async function financeExportRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('FINANCE'));

  // Export operations are heavy (file generation)
  app.register(
    async (heavyApp) => {
      heavyApp.register(rateLimit, rateLimitConfig.heavy);
      heavyApp.register(exportAccountingController);
      heavyApp.register(exportSpedEcdController);
      heavyApp.register(exportSpedEfdController);
    },
    { prefix: '' },
  );
}
