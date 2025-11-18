import { app } from '@/app';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { deleteNotificationController } from './v1-delete-notification.controller';
import { listNotificationsByUserIdController } from './v1-list-notifications.controller';
import { markAllAsReadController } from './v1-mark-all-as-read.controller';
import { markAsReadController } from './v1-mark-as-read.controller';

export async function notificationsRoutes() {
  // Authenticated user routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(listNotificationsByUserIdController);
      queryApp.register(markAsReadController);
      queryApp.register(markAllAsReadController);
      queryApp.register(deleteNotificationController);
    },
    { prefix: '' },
  );
}
