import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';

import { createOverdueEscalationController } from './v1-create-overdue-escalation.controller';
import { listOverdueEscalationsController } from './v1-list-overdue-escalations.controller';
import { getOverdueEscalationByIdController } from './v1-get-overdue-escalation-by-id.controller';
import { updateOverdueEscalationController } from './v1-update-overdue-escalation.controller';
import { deleteOverdueEscalationController } from './v1-delete-overdue-escalation.controller';
import { processOverdueEscalationsController } from './v1-process-overdue-escalations.controller';
import { getCustomerScoreController } from './v1-get-customer-score.controller';
import { getEntryEscalationHistoryController } from './v1-get-entry-escalation-history.controller';
import { getEscalationTimelineController } from './v1-get-escalation-timeline.controller';

export async function financeEscalationsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('FINANCE'));

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(listOverdueEscalationsController);
      queryApp.register(getOverdueEscalationByIdController);
      queryApp.register(getCustomerScoreController);
      queryApp.register(getEntryEscalationHistoryController);
      queryApp.register(getEscalationTimelineController);
    },
    { prefix: '' },
  );

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.financeMutation);
      mutationApp.register(createOverdueEscalationController);
      mutationApp.register(updateOverdueEscalationController);
      mutationApp.register(deleteOverdueEscalationController);
    },
    { prefix: '' },
  );

  // Heavy processing — escalation processing is a batch operation
  app.register(
    async (heavyApp) => {
      heavyApp.register(rateLimit, rateLimitConfig.financeBulk);
      heavyApp.register(processOverdueEscalationsController);
    },
    { prefix: '' },
  );
}
