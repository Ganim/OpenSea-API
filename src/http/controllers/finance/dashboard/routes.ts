import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';

import { getFinanceDashboardController } from './v1-get-finance-dashboard.controller';
import { getForecastController } from './v1-get-forecast.controller';
import { getCashflowController } from './v1-get-cashflow.controller';
import { getDREInteractiveController } from './v1-get-dre-interactive.controller';
import { getFinanceOverviewController } from './v1-get-finance-overview.controller';

export async function financeDashboardRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('FINANCE'));

  app.register(getFinanceDashboardController);
  app.register(getForecastController);
  app.register(getCashflowController);
  app.register(getDREInteractiveController);
  app.register(getFinanceOverviewController);
}
