import type { FastifyInstance } from 'fastify';
import { v1IssueInvoiceController } from './v1-issue-invoice.controller';
import { v1GetInvoiceController } from './v1-get-invoice.controller';
import { v1CancelInvoiceController } from './v1-cancel-invoice.controller';
import { v1ListInvoicesController } from './v1-list-invoices.controller';
import { v1ConfigureFocusNfeController } from './v1-configure-focus-nfe.controller';

export async function invoicingRoutes(app: FastifyInstance) {
  await app.register(v1IssueInvoiceController);
  await app.register(v1GetInvoiceController);
  await app.register(v1CancelInvoiceController);
  await app.register(v1ListInvoicesController);
  await app.register(v1ConfigureFocusNfeController);
}
