import type { FastifyInstance } from 'fastify';

import { getFinanceDashboardController } from './v1-get-finance-dashboard.controller';
import { getForecastController } from './v1-get-forecast.controller';
import { getCashflowController } from './v1-get-cashflow.controller';

export async function financeDashboardRoutes(app: FastifyInstance) {
  app.register(getFinanceDashboardController);
  app.register(getForecastController);
  app.register(getCashflowController);
}
