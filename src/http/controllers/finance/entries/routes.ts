import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';

import { createFinanceEntryController } from './v1-create-finance-entry.controller';
import { updateFinanceEntryController } from './v1-update-finance-entry.controller';
import { deleteFinanceEntryController } from './v1-delete-finance-entry.controller';
import { getFinanceEntryByIdController } from './v1-get-finance-entry-by-id.controller';
import { listFinanceEntriesController } from './v1-list-finance-entries.controller';
import { registerPaymentController } from './v1-register-payment.controller';
import { cancelFinanceEntryController } from './v1-cancel-finance-entry.controller';
import { parseBoletoController } from './v1-parse-boleto.controller';
import { parsePixController } from './v1-parse-pix.controller';
import { checkOverdueController } from './v1-check-overdue.controller';
import { importPayrollController } from './v1-import-payroll.controller';
import { ocrExtractDataController } from './v1-ocr-extract-data.controller';
import { ocrUploadBatchController } from './v1-ocr-upload-batch.controller';
import { getLastSupplierEntryController } from './v1-get-last-supplier-entry.controller';
import { createEntriesBatchController } from './v1-create-entries-batch.controller';

export async function financeEntriesRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('FINANCE'));

  app.register(getFinanceEntryByIdController);
  app.register(listFinanceEntriesController);
  app.register(createFinanceEntryController);
  app.register(createEntriesBatchController);
  app.register(updateFinanceEntryController);
  app.register(deleteFinanceEntryController);
  app.register(registerPaymentController);
  app.register(cancelFinanceEntryController);
  app.register(parseBoletoController);
  app.register(parsePixController);
  app.register(checkOverdueController);
  app.register(importPayrollController);
  app.register(ocrExtractDataController);
  app.register(ocrUploadBatchController);
  app.register(getLastSupplierEntryController);
}
