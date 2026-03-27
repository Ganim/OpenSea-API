import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';

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

  app.register(createOverdueEscalationController);
  app.register(listOverdueEscalationsController);
  app.register(getOverdueEscalationByIdController);
  app.register(updateOverdueEscalationController);
  app.register(deleteOverdueEscalationController);
  app.register(processOverdueEscalationsController);
  app.register(getCustomerScoreController);
  app.register(getEntryEscalationHistoryController);
  app.register(getEscalationTimelineController);
}
