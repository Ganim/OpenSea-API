import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { v1ExportEmployeesReportController } from './v1-export-employees-report.controller';
import { v1ExportAbsencesReportController } from './v1-export-absences-report.controller';
import { v1ExportPayrollReportController } from './v1-export-payroll-report.controller';
import { v1GenerateRaisReportController } from './v1-generate-rais-report.controller';
import { v1GenerateDirfReportController } from './v1-generate-dirf-report.controller';
import { v1GenerateSefipReportController } from './v1-generate-sefip-report.controller';
import { v1GenerateCagedReportController } from './v1-generate-caged-report.controller';

export async function hrReportsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('HR'));

  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(v1ExportEmployeesReportController);
      queryApp.register(v1ExportAbsencesReportController);
      queryApp.register(v1ExportPayrollReportController);
      queryApp.register(v1GenerateRaisReportController);
      queryApp.register(v1GenerateDirfReportController);
      queryApp.register(v1GenerateSefipReportController);
      queryApp.register(v1GenerateCagedReportController);
    },
    { prefix: '' },
  );
}
