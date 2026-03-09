import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { listFolderAccessController } from './v1-list-folder-access.controller';
import { removeFolderAccessController } from './v1-remove-folder-access.controller';
import { setFolderAccessController } from './v1-set-folder-access.controller';

export async function storageAccessRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('STORAGE'));

  // Admin routes with elevated rate limit
  app.register(
    async (adminApp) => {
      adminApp.register(rateLimit, rateLimitConfig.admin);
      adminApp.register(removeFolderAccessController);
    },
    { prefix: '' },
  );

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(setFolderAccessController);
    },
    { prefix: '' },
  );

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(listFolderAccessController);
    },
    { prefix: '' },
  );
}
