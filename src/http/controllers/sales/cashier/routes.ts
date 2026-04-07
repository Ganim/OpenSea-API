import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import type { FastifyInstance } from 'fastify';
import { cashMovementController } from './v1-cash-movement.controller';
import { closeCashierSessionController } from './v1-close-cashier-session.controller';
import { createCashierTransactionController } from './v1-create-cashier-transaction.controller';
import { getActiveSessionController } from './v1-get-active-session.controller';
import { getCashierSessionByIdController } from './v1-get-cashier-session-by-id.controller';
import { getCashierSessionReportController } from './v1-get-cashier-session-report.controller';
import { listCashierSessionsController } from './v1-list-cashier-sessions.controller';
import { listCashierTransactionsController } from './v1-list-cashier-transactions.controller';
import { openCashierSessionController } from './v1-open-cashier-session.controller';
import { reconcileSessionController } from './v1-reconcile-session.controller';

export async function salesCashierRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('SALES'));

  await app.register(openCashierSessionController);
  await app.register(closeCashierSessionController);
  await app.register(getActiveSessionController);
  await app.register(getCashierSessionByIdController);
  await app.register(listCashierSessionsController);
  await app.register(createCashierTransactionController);
  await app.register(listCashierTransactionsController);
  await app.register(getCashierSessionReportController);
  await app.register(cashMovementController);
  await app.register(reconcileSessionController);
}
