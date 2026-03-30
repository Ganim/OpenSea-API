import type { FastifyInstance } from 'fastify';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';

import { getExchangeRateController } from './v1-get-exchange-rate.controller';

export async function financeExchangeRatesRoutes(app: FastifyInstance) {
  // Public query route — no module middleware needed
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.public);
      queryApp.register(getExchangeRateController);
    },
    { prefix: '' },
  );
}
