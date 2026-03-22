import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';

// Terminals
import { v1CreateTerminalController } from './terminals/v1-create-terminal.controller';
import { v1ListTerminalsController } from './terminals/v1-list-terminals.controller';
import { v1UpdateTerminalController } from './terminals/v1-update-terminal.controller';
import { v1DeleteTerminalController } from './terminals/v1-delete-terminal.controller';

// Sessions
import { v1OpenSessionController } from './sessions/v1-open-session.controller';
import { v1CloseSessionController } from './sessions/v1-close-session.controller';
import { v1GetActiveSessionController } from './sessions/v1-get-active-session.controller';
import { v1ListSessionsController } from './sessions/v1-list-sessions.controller';

// Transactions
import { v1CreateTransactionController } from './transactions/v1-create-transaction.controller';
import { v1CancelTransactionController } from './transactions/v1-cancel-transaction.controller';
import { v1ListTransactionsController } from './transactions/v1-list-transactions.controller';

// Cash
import { v1CashMovementController } from './cash/v1-cash-movement.controller';

export async function posRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('SALES'));

  // Terminals
  await app.register(v1ListTerminalsController);
  await app.register(v1CreateTerminalController);
  await app.register(v1UpdateTerminalController);
  await app.register(v1DeleteTerminalController);

  // Sessions
  await app.register(v1OpenSessionController);
  await app.register(v1CloseSessionController);
  await app.register(v1GetActiveSessionController);
  await app.register(v1ListSessionsController);

  // Transactions
  await app.register(v1CreateTransactionController);
  await app.register(v1CancelTransactionController);
  await app.register(v1ListTransactionsController);

  // Cash
  await app.register(v1CashMovementController);
}
