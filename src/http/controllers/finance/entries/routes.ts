import type { FastifyInstance } from 'fastify';

import { createFinanceEntryController } from './v1-create-finance-entry.controller';
import { updateFinanceEntryController } from './v1-update-finance-entry.controller';
import { deleteFinanceEntryController } from './v1-delete-finance-entry.controller';
import { getFinanceEntryByIdController } from './v1-get-finance-entry-by-id.controller';
import { listFinanceEntriesController } from './v1-list-finance-entries.controller';
import { registerPaymentController } from './v1-register-payment.controller';
import { cancelFinanceEntryController } from './v1-cancel-finance-entry.controller';
import { parseBoletoController } from './v1-parse-boleto.controller';
import { checkOverdueController } from './v1-check-overdue.controller';

export async function financeEntriesRoutes(app: FastifyInstance) {
  app.register(getFinanceEntryByIdController);
  app.register(listFinanceEntriesController);
  app.register(createFinanceEntryController);
  app.register(updateFinanceEntryController);
  app.register(deleteFinanceEntryController);
  app.register(registerPaymentController);
  app.register(cancelFinanceEntryController);
  app.register(parseBoletoController);
  app.register(checkOverdueController);
}
