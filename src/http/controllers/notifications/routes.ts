import { app } from '@/app';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { deleteNotificationController } from './v1-delete-notification.controller';
import { listNotificationsByUserIdController } from './v1-list-notifications-by-user-id.controller';
import { markAllAsReadController } from './v1-mark-all-as-read.controller';
import { markAsReadController } from './v1-mark-as-read.controller';
import { sendNotificationEmailController } from './v1-send-notification-email.controller';
import { processScheduledNotificationsController } from './v1-process-scheduled-notifications.controller';

export async function notificationsRoutes() {
  // Authenticated user routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(listNotificationsByUserIdController);
      queryApp.register(markAsReadController);
      queryApp.register(markAllAsReadController);
      queryApp.register(deleteNotificationController);
      queryApp.register(sendNotificationEmailController);
      queryApp.register(processScheduledNotificationsController);
    },
    { prefix: '' },
  );
}
