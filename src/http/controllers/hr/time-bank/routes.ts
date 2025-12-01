import { app } from '@/app';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { adjustTimeBankController } from './v1-adjust-time-bank.controller';
import { creditTimeBankController } from './v1-credit-time-bank.controller';
import { debitTimeBankController } from './v1-debit-time-bank.controller';
import { getTimeBankController } from './v1-get-time-bank.controller';
import { listTimeBanksController } from './v1-list-time-banks.controller';

export async function timeBankRoutes() {
  // Manager mutation routes
  app.register(
    async (managerApp) => {
      managerApp.register(rateLimit, rateLimitConfig.mutation);
      managerApp.register(creditTimeBankController);
      managerApp.register(debitTimeBankController);
      managerApp.register(adjustTimeBankController);
    },
    { prefix: '' },
  );

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(getTimeBankController);
      queryApp.register(listTimeBanksController);
    },
    { prefix: '' },
  );
}
