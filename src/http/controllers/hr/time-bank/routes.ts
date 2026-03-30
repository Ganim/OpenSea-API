import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { v1AdjustTimeBankController } from './v1-adjust-time-bank.controller';
import { v1CreditTimeBankController } from './v1-credit-time-bank.controller';
import { v1DebitTimeBankController } from './v1-debit-time-bank.controller';
import { v1GetTimeBankController } from './v1-get-time-bank.controller';
import { v1ListTimeBanksController } from './v1-list-time-banks.controller';

export async function timeBankRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('HR'));

  // Manager mutation routes
  app.register(
    async (managerApp) => {
      managerApp.register(rateLimit, rateLimitConfig.mutation);
      managerApp.register(v1CreditTimeBankController);
      managerApp.register(v1DebitTimeBankController);
      managerApp.register(v1AdjustTimeBankController);
    },
    { prefix: '' },
  );

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(v1GetTimeBankController);
      queryApp.register(v1ListTimeBanksController);
    },
    { prefix: '' },
  );
}
