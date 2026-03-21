import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { createTerminalController } from './v1-create-terminal.controller';
import { listTerminalsController } from './v1-list-terminals.controller';
import { updateTerminalController } from './v1-update-terminal.controller';
import { deleteTerminalController } from './v1-delete-terminal.controller';
import { openSessionController } from './v1-open-session.controller';
import { closeSessionController } from './v1-close-session.controller';
import { listSessionsController } from './v1-list-sessions.controller';
import { createTransactionController } from './v1-create-transaction.controller';
import { cancelTransactionController } from './v1-cancel-transaction.controller';
import { listTransactionsController } from './v1-list-transactions.controller';
import { cashMovementController } from './v1-cash-movement.controller';

export async function posRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('SALES'));

  // Admin routes with elevated rate limit (delete)
  app.register(
    async (adminApp) => {
      adminApp.register(rateLimit, rateLimitConfig.admin);
      adminApp.register(deleteTerminalController);
    },
    { prefix: '' },
  );

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(createTerminalController);
      mutationApp.register(updateTerminalController);
      mutationApp.register(openSessionController);
      mutationApp.register(closeSessionController);
      mutationApp.register(createTransactionController);
      mutationApp.register(cancelTransactionController);
      mutationApp.register(cashMovementController);
    },
    { prefix: '' },
  );

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(listTerminalsController);
      queryApp.register(listSessionsController);
      queryApp.register(listTransactionsController);
    },
    { prefix: '' },
  );
}
