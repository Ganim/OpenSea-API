import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';

import { createLoanController } from './v1-create-loan.controller';
import { updateLoanController } from './v1-update-loan.controller';
import { deleteLoanController } from './v1-delete-loan.controller';
import { getLoanByIdController } from './v1-get-loan-by-id.controller';
import { listLoansController } from './v1-list-loans.controller';
import { registerLoanPaymentController } from './v1-register-loan-payment.controller';

export async function loansRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('FINANCE'));

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(getLoanByIdController);
      queryApp.register(listLoansController);
    },
    { prefix: '' },
  );

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.financeMutation);
      mutationApp.register(createLoanController);
      mutationApp.register(updateLoanController);
      mutationApp.register(deleteLoanController);
      mutationApp.register(registerLoanPaymentController);
    },
    { prefix: '' },
  );
}
