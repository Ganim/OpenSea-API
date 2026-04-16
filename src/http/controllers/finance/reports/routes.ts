import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';

import { getDfcController } from './v1-get-dfc.controller';
import { getDreController } from './v1-get-dre.controller';
import { getLedgerController } from './v1-get-ledger.controller';
import { getTrialBalanceController } from './v1-get-trial-balance.controller';

export async function financeReportsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('FINANCE'));

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(getDfcController);
      queryApp.register(getDreController);
      queryApp.register(getLedgerController);
      queryApp.register(getTrialBalanceController);
    },
    { prefix: '' },
  );
}
