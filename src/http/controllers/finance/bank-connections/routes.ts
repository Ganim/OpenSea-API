import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';

import { getConnectTokenController } from './v1-get-connect-token.controller';
import { connectBankController } from './v1-connect-bank.controller';
import { syncBankTransactionsController } from './v1-sync-bank-transactions.controller';
import { disconnectBankController } from './v1-disconnect-bank.controller';

export async function bankConnectionsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('FINANCE'));

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(getConnectTokenController);
    },
    { prefix: '' },
  );

  // Integration/webhook routes — bank sync is heavy and external
  app.register(
    async (integrationApp) => {
      integrationApp.register(rateLimit, rateLimitConfig.financeWebhook);
      integrationApp.register(connectBankController);
      integrationApp.register(syncBankTransactionsController);
      integrationApp.register(disconnectBankController);
    },
    { prefix: '' },
  );
}
