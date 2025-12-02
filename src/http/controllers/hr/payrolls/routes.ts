import { app } from '@/app';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { approvePayrollController } from './v1-approve-payroll.controller';
import { calculatePayrollController } from './v1-calculate-payroll.controller';
import { cancelPayrollController } from './v1-cancel-payroll.controller';
import { createPayrollController } from './v1-create-payroll.controller';
import { getPayrollController } from './v1-get-payroll.controller';
import { listPayrollsController } from './v1-list-payrolls.controller';
import { payPayrollController } from './v1-pay-payroll.controller';

export async function payrollsRoutes() {
  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(createPayrollController);
      mutationApp.register(calculatePayrollController);
      mutationApp.register(approvePayrollController);
      mutationApp.register(payPayrollController);
      mutationApp.register(cancelPayrollController);
    },
    { prefix: '' },
  );

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(getPayrollController);
      queryApp.register(listPayrollsController);
    },
    { prefix: '' },
  );
}
