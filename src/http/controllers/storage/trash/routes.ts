import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance } from 'fastify';
import { emptyTrashController } from './v1-empty-trash.controller';
import { listDeletedItemsController } from './v1-list-deleted-items.controller';
import { restoreFileController } from './v1-restore-file.controller';
import { restoreFolderController } from './v1-restore-folder.controller';

export async function storageTrashRoutes(app: FastifyInstance) {
  // Admin routes (empty trash)
  app.register(
    async (adminApp) => {
      adminApp.register(rateLimit, rateLimitConfig.admin);
      adminApp.register(emptyTrashController);
    },
    { prefix: '' },
  );

  // Mutation routes (restore)
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(restoreFileController);
      mutationApp.register(restoreFolderController);
    },
    { prefix: '' },
  );

  // Query routes (list)
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(listDeletedItemsController);
    },
    { prefix: '' },
  );
}
