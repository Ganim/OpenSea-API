import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';

import { getFinanceDashboardController } from './v1-get-finance-dashboard.controller';
import { getForecastController } from './v1-get-forecast.controller';
import { getCashflowController } from './v1-get-cashflow.controller';
import { getDREInteractiveController } from './v1-get-dre-interactive.controller';
import { getDREConsolidatedController } from './v1-get-dre-consolidated.controller';
import { getFinanceOverviewController } from './v1-get-finance-overview.controller';
import { detectAnomaliesController } from './v1-detect-anomalies.controller';
import { getPredictiveCashflowController } from './v1-get-predictive-cashflow.controller';
import { getPaymentTimingController } from './v1-get-payment-timing.controller';
import { getCashflowAccuracyController } from './v1-get-cashflow-accuracy.controller';
import { getFinancialHealthController } from './v1-get-financial-health.controller';
import { getBalanceSheetController } from './v1-get-balance-sheet.controller';
import { getDashboardQuickActionsController } from './v1-get-dashboard-quick-actions.controller';
import { checkCashFlowAlertsController } from './v1-check-cashflow-alerts.controller';

export async function financeDashboardRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('FINANCE'));

  // All dashboard routes are queries — some are heavy (analytics/AI)
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(getFinanceDashboardController);
      queryApp.register(getCashflowController);
      queryApp.register(getFinanceOverviewController);
      queryApp.register(getDashboardQuickActionsController);
      queryApp.register(checkCashFlowAlertsController);
    },
    { prefix: '' },
  );

  // Heavy analytics/AI-powered routes
  app.register(
    async (heavyApp) => {
      heavyApp.register(rateLimit, rateLimitConfig.heavy);
      heavyApp.register(getForecastController);
      heavyApp.register(getDREInteractiveController);
      heavyApp.register(getDREConsolidatedController);
      heavyApp.register(detectAnomaliesController);
      heavyApp.register(getPredictiveCashflowController);
      heavyApp.register(getPaymentTimingController);
      heavyApp.register(getCashflowAccuracyController);
      heavyApp.register(getFinancialHealthController);
      heavyApp.register(getBalanceSheetController);
    },
    { prefix: '' },
  );
}
