import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { v1CalculateWorkedHoursController } from './v1-calculate-worked-hours.controller';
import { v1ClockInController } from './v1-clock-in.controller';
import { v1ClockOutController } from './v1-clock-out.controller';
import { v1GenerateAFDController } from './v1-generate-afd.controller';
import { v1GenerateAFDTController } from './v1-generate-afdt.controller';
import { v1GeneratePunchReceiptPDFController } from './v1-generate-punch-receipt-pdf.controller';
import { v1GenerateTimesheetPDFController } from './v1-generate-timesheet-pdf.controller';
import { v1ListTimeEntriesController } from './v1-list-time-entries.controller';

export async function timeControlRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('HR'));

  // Mutation routes - clock in/out
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(v1ClockInController);
      mutationApp.register(v1ClockOutController);
      mutationApp.register(v1CalculateWorkedHoursController);
    },
    { prefix: '' },
  );

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(v1ListTimeEntriesController);
      queryApp.register(v1GenerateAFDController);
      queryApp.register(v1GenerateAFDTController);
      queryApp.register(v1GenerateTimesheetPDFController);
      queryApp.register(v1GeneratePunchReceiptPDFController);
    },
    { prefix: '' },
  );
}
