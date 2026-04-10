import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import type { FastifyInstance } from 'fastify';
import { v1CreateLabelPrintJobController } from './v1-create-label-print-job.controller';
import { v1ListPrintJobsController } from './v1-list-print-jobs.controller';
import { v1PreviewReceiptController } from './v1-preview-receipt.controller';
import { v1QueueReceiptController } from './v1-queue-receipt.controller';
import { v1RetryPrintJobController } from './v1-retry-print-job.controller';

export async function printingRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('SALES'));

  await app.register(v1QueueReceiptController);
  await app.register(v1PreviewReceiptController);
  await app.register(v1CreateLabelPrintJobController);
  await app.register(v1ListPrintJobsController);
  await app.register(v1RetryPrintJobController);
}
