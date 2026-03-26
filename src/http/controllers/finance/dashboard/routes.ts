import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';

import { getFinanceDashboardController } from './v1-get-finance-dashboard.controller';
import { getForecastController } from './v1-get-forecast.controller';
import { getCashflowController } from './v1-get-cashflow.controller';
import { getDREInteractiveController } from './v1-get-dre-interactive.controller';
import { getFinanceOverviewController } from './v1-get-finance-overview.controller';
import { detectAnomaliesController } from './v1-detect-anomalies.controller';
import { getPredictiveCashflowController } from './v1-get-predictive-cashflow.controller';
import { getPaymentTimingController } from './v1-get-payment-timing.controller';

export async function financeDashboardRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('FINANCE'));

  app.register(getFinanceDashboardController);
  app.register(getForecastController);
  app.register(getCashflowController);
  app.register(getDREInteractiveController);
  app.register(getFinanceOverviewController);
  app.register(detectAnomaliesController);
  app.register(getPredictiveCashflowController);
  app.register(getPaymentTimingController);
}
