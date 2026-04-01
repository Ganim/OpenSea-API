import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';

import { listJournalEntriesController } from './v1-list-journal-entries.controller';
import { getJournalEntryController } from './v1-get-journal-entry.controller';
import { createJournalEntryController } from './v1-create-journal-entry.controller';
import { reverseJournalEntryController } from './v1-reverse-journal-entry.controller';

export async function journalEntriesRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('FINANCE'));

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(listJournalEntriesController);
      queryApp.register(getJournalEntryController);
    },
    { prefix: '' },
  );

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.financeMutation);
      mutationApp.register(createJournalEntryController);
      mutationApp.register(reverseJournalEntryController);
    },
    { prefix: '' },
  );
}
