import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';

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
import { createBoletoForEntryController } from './v1-create-boleto-for-entry.controller';
import { emitNfeFromEntryController } from './v1-emit-nfe-from-entry.controller';
import { createPixChargeController } from './v1-create-pix-charge.controller';
import { payViaPixController } from './v1-pay-via-pix.controller';
import { createEntriesBatchController } from './v1-create-entries-batch.controller';
import { bulkPayEntriesController } from './v1-bulk-pay-entries.controller';
import { bulkCancelEntriesController } from './v1-bulk-cancel-entries.controller';
import { bulkDeleteEntriesController } from './v1-bulk-delete-entries.controller';
import { bulkCategorizeEntriesController } from './v1-bulk-categorize-entries.controller';
import { emailToEntryConfigController } from './v1-email-to-entry-config.controller';
import { processEmailToEntryController } from './v1-process-email-to-entry.controller';
import { calculateEntryRetentionsController } from './v1-calculate-entry-retentions.controller';
import { applyEntryRetentionsController } from './v1-apply-entry-retentions.controller';
import { listEntryRetentionsController } from './v1-list-entry-retentions.controller';
import { threeWayMatchController } from './v1-three-way-match.controller';
import { checkDuplicateController } from './v1-check-duplicate.controller';
import { getSupplierSummaryController } from './v1-get-supplier-summary.controller';
import { splitPaymentController } from './v1-split-payment.controller';
import { suggestCategoryController } from './v1-suggest-category.controller';
import { createEntryFromSalesOrderController } from './v1-create-entry-from-sales-order.controller';

export async function financeEntriesRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('FINANCE'));

  // Query routes — rate limit de consulta
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(getFinanceEntryByIdController);
      queryApp.register(listFinanceEntriesController);
      queryApp.register(getLastSupplierEntryController);
      queryApp.register(listEntryRetentionsController);
      queryApp.register(checkDuplicateController);
      queryApp.register(getSupplierSummaryController);
      queryApp.register(suggestCategoryController);
      queryApp.register(checkOverdueController);
    },
    { prefix: '' },
  );

  // Mutation routes — rate limit financeiro para operações individuais
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.financeMutation);
      mutationApp.register(createFinanceEntryController);
      mutationApp.register(updateFinanceEntryController);
      mutationApp.register(deleteFinanceEntryController);
      mutationApp.register(registerPaymentController);
      mutationApp.register(cancelFinanceEntryController);
      mutationApp.register(splitPaymentController);
      mutationApp.register(emailToEntryConfigController);
      mutationApp.register(processEmailToEntryController);
      mutationApp.register(calculateEntryRetentionsController);
      mutationApp.register(applyEntryRetentionsController);
      mutationApp.register(threeWayMatchController);
      mutationApp.register(createEntryFromSalesOrderController);
    },
    { prefix: '' },
  );

  // Bulk operations — rate limit restritivo para operações em lote
  app.register(
    async (bulkApp) => {
      bulkApp.register(rateLimit, rateLimitConfig.financeBulk);
      bulkApp.register(createEntriesBatchController);
      bulkApp.register(bulkPayEntriesController);
      bulkApp.register(bulkCancelEntriesController);
      bulkApp.register(bulkDeleteEntriesController);
      bulkApp.register(bulkCategorizeEntriesController);
      bulkApp.register(importPayrollController);
      bulkApp.register(ocrUploadBatchController);
    },
    { prefix: '' },
  );

  // Heavy/integration routes — rate limit para operações custosas e integrações
  app.register(
    async (heavyApp) => {
      heavyApp.register(rateLimit, rateLimitConfig.financeWebhook);
      heavyApp.register(parseBoletoController);
      heavyApp.register(parsePixController);
      heavyApp.register(ocrExtractDataController);
      heavyApp.register(createBoletoForEntryController);
      heavyApp.register(createPixChargeController);
      heavyApp.register(payViaPixController);
      heavyApp.register(emitNfeFromEntryController);
    },
    { prefix: '' },
  );
}
