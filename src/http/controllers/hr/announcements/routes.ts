import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { v1CreateAnnouncementController } from './v1-create-announcement.controller';
import { v1DeleteAnnouncementController } from './v1-delete-announcement.controller';
import { v1GetAnnouncementStatsController } from './v1-get-announcement-stats.controller';
import { v1ListAnnouncementReceiptsController } from './v1-list-announcement-receipts.controller';
import { v1ListAnnouncementsController } from './v1-list-announcements.controller';
import { v1MarkAnnouncementReadController } from './v1-mark-announcement-read.controller';
import { v1UpdateAnnouncementController } from './v1-update-announcement.controller';

export async function hrAnnouncementsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('HR'));

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(v1CreateAnnouncementController);
      mutationApp.register(v1UpdateAnnouncementController);
      mutationApp.register(v1DeleteAnnouncementController);
      mutationApp.register(v1MarkAnnouncementReadController);
    },
    { prefix: '' },
  );

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(v1ListAnnouncementsController);
      queryApp.register(v1ListAnnouncementReceiptsController);
      queryApp.register(v1GetAnnouncementStatsController);
    },
    { prefix: '' },
  );
}
