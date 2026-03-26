import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { v1GetEsocialDashboardController } from './v1-get-esocial-dashboard.controller';
import { v1ListEsocialEventsController } from './v1-list-esocial-events.controller';
import { v1GetEsocialEventController } from './v1-get-esocial-event.controller';
import { v1UpdateEventStatusController } from './v1-update-event-status.controller';
import { v1BulkApproveEventsController } from './v1-bulk-approve-events.controller';
import { v1TransmitBatchController } from './v1-transmit-batch.controller';
import { v1ListEsocialBatchesController } from './v1-list-esocial-batches.controller';
import { v1GetEsocialBatchController } from './v1-get-esocial-batch.controller';
import { v1CheckBatchStatusController } from './v1-check-batch-status.controller';
// Config and certificate routes are now in controllers/esocial/ (dedicated module)
// import { v1EsocialConfigController } from './v1-esocial-config.controller';
// import { v1EsocialCertificateController } from './v1-esocial-certificate.controller';
// Phase 2 — XML Event Builders
import { v1GenerateEventController } from './v1-generate-event.controller';
import { v1ReviewEventController } from './v1-review-event.controller';
import { v1ApproveEventController } from './v1-approve-event.controller';
import { v1RejectEventController } from './v1-reject-event.controller';
import { v1RectifyEventController } from './v1-rectify-event.controller';
import { v1DeleteEventController } from './v1-delete-event.controller';

export async function esocialRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('HR'));

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(v1GetEsocialDashboardController);
      queryApp.register(v1ListEsocialEventsController);
      queryApp.register(v1GetEsocialEventController);
      queryApp.register(v1ListEsocialBatchesController);
      queryApp.register(v1GetEsocialBatchController);
      // Config and certificate routes moved to controllers/esocial/
    },
    { prefix: '' },
  );

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      // Phase 1 — unified status update
      mutationApp.register(v1UpdateEventStatusController);
      mutationApp.register(v1BulkApproveEventsController);
      mutationApp.register(v1TransmitBatchController);
      mutationApp.register(v1CheckBatchStatusController);
      // Phase 2 — individual lifecycle endpoints
      mutationApp.register(v1GenerateEventController);
      mutationApp.register(v1ReviewEventController);
      mutationApp.register(v1ApproveEventController);
      mutationApp.register(v1RejectEventController);
      mutationApp.register(v1RectifyEventController);
      mutationApp.register(v1DeleteEventController);
    },
    { prefix: '' },
  );
}
