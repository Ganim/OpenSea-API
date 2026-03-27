import type { FastifyInstance } from 'fastify';

import { financeQueryController } from './v1-finance-query.controller';

export async function aiFinanceRoutes(app: FastifyInstance) {
  app.register(financeQueryController);
}
