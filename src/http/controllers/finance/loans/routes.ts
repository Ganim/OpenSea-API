import type { FastifyInstance } from 'fastify';

import { createLoanController } from './v1-create-loan.controller';
import { updateLoanController } from './v1-update-loan.controller';
import { deleteLoanController } from './v1-delete-loan.controller';
import { getLoanByIdController } from './v1-get-loan-by-id.controller';
import { listLoansController } from './v1-list-loans.controller';
import { registerLoanPaymentController } from './v1-register-loan-payment.controller';

export async function loansRoutes(app: FastifyInstance) {
  app.register(getLoanByIdController);
  app.register(listLoansController);
  app.register(createLoanController);
  app.register(updateLoanController);
  app.register(deleteLoanController);
  app.register(registerLoanPaymentController);
}
