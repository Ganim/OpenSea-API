import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';

import { importOfxReconciliationController } from './v1-import-ofx-reconciliation.controller';
import { getReconciliationByIdController } from './v1-get-reconciliation-by-id.controller';
import { listReconciliationsController } from './v1-list-reconciliations.controller';
import { manualMatchItemController } from './v1-manual-match-item.controller';
import { ignoreReconciliationItemController } from './v1-ignore-reconciliation-item.controller';
import { createEntryFromItemController } from './v1-create-entry-from-item.controller';
import { completeReconciliationController } from './v1-complete-reconciliation.controller';
import { listReconciliationSuggestionsController } from './v1-list-reconciliation-suggestions.controller';
import { acceptReconciliationSuggestionController } from './v1-accept-reconciliation-suggestion.controller';
import { rejectReconciliationSuggestionController } from './v1-reject-reconciliation-suggestion.controller';
import { processCnabReturnController } from './v1-process-cnab-return.controller';

export async function reconciliationRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('FINANCE'));

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(getReconciliationByIdController);
      queryApp.register(listReconciliationsController);
      queryApp.register(listReconciliationSuggestionsController);
    },
    { prefix: '' },
  );

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.financeMutation);
      mutationApp.register(manualMatchItemController);
      mutationApp.register(ignoreReconciliationItemController);
      mutationApp.register(createEntryFromItemController);
      mutationApp.register(completeReconciliationController);
      mutationApp.register(acceptReconciliationSuggestionController);
      mutationApp.register(rejectReconciliationSuggestionController);
    },
    { prefix: '' },
  );

  // Heavy operations — OFX import and CNAB processing
  app.register(
    async (heavyApp) => {
      heavyApp.register(rateLimit, rateLimitConfig.financeBulk);
      heavyApp.register(importOfxReconciliationController);
      heavyApp.register(processCnabReturnController);
    },
    { prefix: '' },
  );
}
