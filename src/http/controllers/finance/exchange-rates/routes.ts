import type { FastifyInstance } from 'fastify';

import { getExchangeRateController } from './v1-get-exchange-rate.controller';

export async function financeExchangeRatesRoutes(app: FastifyInstance) {
  app.register(getExchangeRateController);
}
