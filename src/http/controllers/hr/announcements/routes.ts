import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { v1CreateAnnouncementController } from './v1-create-announcement.controller';
import { v1ListAnnouncementsController } from './v1-list-announcements.controller';
import { v1UpdateAnnouncementController } from './v1-update-announcement.controller';
import { v1DeleteAnnouncementController } from './v1-delete-announcement.controller';

export async function hrAnnouncementsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('HR'));

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(v1CreateAnnouncementController);
      mutationApp.register(v1UpdateAnnouncementController);
      mutationApp.register(v1DeleteAnnouncementController);
    },
    { prefix: '' },
  );

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(v1ListAnnouncementsController);
    },
    { prefix: '' },
  );
}
