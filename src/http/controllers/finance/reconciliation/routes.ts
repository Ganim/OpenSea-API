import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';

import { importOfxReconciliationController } from './v1-import-ofx-reconciliation.controller';
import { getReconciliationByIdController } from './v1-get-reconciliation-by-id.controller';
import { listReconciliationsController } from './v1-list-reconciliations.controller';
import { manualMatchItemController } from './v1-manual-match-item.controller';
import { ignoreReconciliationItemController } from './v1-ignore-reconciliation-item.controller';
import { createEntryFromItemController } from './v1-create-entry-from-item.controller';
import { completeReconciliationController } from './v1-complete-reconciliation.controller';

export async function reconciliationRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('FINANCE'));

  app.register(importOfxReconciliationController);
  app.register(getReconciliationByIdController);
  app.register(listReconciliationsController);
  app.register(manualMatchItemController);
  app.register(ignoreReconciliationItemController);
  app.register(createEntryFromItemController);
  app.register(completeReconciliationController);
}
