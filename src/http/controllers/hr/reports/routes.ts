import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { exportEmployeesReportController } from './v1-export-employees-report.controller';
import { exportAbsencesReportController } from './v1-export-absences-report.controller';

export async function hrReportsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('HR'));

  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(exportEmployeesReportController);
      queryApp.register(exportAbsencesReportController);
    },
    { prefix: '' },
  );
}
