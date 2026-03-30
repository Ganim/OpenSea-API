import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { v1ApprovePayrollController } from './v1-approve-payroll.controller';
import { v1CalculatePayrollController } from './v1-calculate-payroll.controller';
import { v1CancelPayrollController } from './v1-cancel-payroll.controller';
import { v1CreatePayrollController } from './v1-create-payroll.controller';
import { v1GetPayrollController } from './v1-get-payroll.controller';
import { v1ListPayrollsController } from './v1-list-payrolls.controller';
import { v1GeneratePayslipPDFController } from './v1-generate-payslip-pdf.controller';
import { v1PayPayrollController } from './v1-pay-payroll.controller';

export async function payrollsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('HR'));

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(v1CreatePayrollController);
      mutationApp.register(v1CalculatePayrollController);
      mutationApp.register(v1ApprovePayrollController);
      mutationApp.register(v1PayPayrollController);
      mutationApp.register(v1CancelPayrollController);
    },
    { prefix: '' },
  );

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(v1GetPayrollController);
      queryApp.register(v1ListPayrollsController);
      queryApp.register(v1GeneratePayslipPDFController);
    },
    { prefix: '' },
  );
}
