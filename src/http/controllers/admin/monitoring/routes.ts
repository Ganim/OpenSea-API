import type { FastifyInstance } from 'fastify';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { v1GetAiUsageReportController } from './v1-get-ai-usage-report.controller';
import { v1GetApiUsageReportController } from './v1-get-api-usage-report.controller';
import { v1GetIntegrationStatusController } from './v1-get-integration-status.controller';
import { v1GetRevenueMetricsController } from './v1-get-revenue-metrics.controller';
import { v1GetSystemHealthController } from './v1-get-system-health.controller';

export async function adminMonitoringRoutes(app: FastifyInstance) {
  // All monitoring routes are read-only queries
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(v1GetSystemHealthController);
      queryApp.register(v1GetIntegrationStatusController);
      queryApp.register(v1GetAiUsageReportController);
      queryApp.register(v1GetApiUsageReportController);
      queryApp.register(v1GetRevenueMetricsController);
    },
    { prefix: '' },
  );
}
