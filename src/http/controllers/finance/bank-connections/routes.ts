import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';

import { getConnectTokenController } from './v1-get-connect-token.controller';
import { connectBankController } from './v1-connect-bank.controller';
import { syncBankTransactionsController } from './v1-sync-bank-transactions.controller';
import { disconnectBankController } from './v1-disconnect-bank.controller';

export async function bankConnectionsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('FINANCE'));

  app.register(getConnectTokenController);
  app.register(connectBankController);
  app.register(syncBankTransactionsController);
  app.register(disconnectBankController);
}
