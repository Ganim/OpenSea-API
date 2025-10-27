import { verifyJwt } from '@/http/middlewares/verify-jwt';
import type { FastifyInstance } from 'fastify';
import { v1CreateNotificationPreferenceController } from './v1-create-notification-preference.controller';
import { v1DeleteNotificationPreferenceController } from './v1-delete-notification-preference.controller';
import { v1ListNotificationPreferencesByUserController } from './v1-list-notification-preferences-by-user.controller';
import { v1UpdateNotificationPreferenceController } from './v1-update-notification-preference.controller';

export async function notificationPreferencesRoutes(app: FastifyInstance) {
  // Create notification preference
  app.post(
    '/v1/notification-preferences',
    {
      onRequest: [verifyJwt],
      schema: v1CreateNotificationPreferenceController.schema,
    },
    v1CreateNotificationPreferenceController,
  );

  // List notification preferences by user
  app.get(
    '/v1/notification-preferences',
    {
      onRequest: [verifyJwt],
      schema: v1ListNotificationPreferencesByUserController.schema,
    },
    v1ListNotificationPreferencesByUserController,
  );

  // Update notification preference
  app.put(
    '/v1/notification-preferences/:id',
    {
      onRequest: [verifyJwt],
      schema: v1UpdateNotificationPreferenceController.schema,
    },
    v1UpdateNotificationPreferenceController,
  );

  // Delete notification preference
  app.delete(
    '/v1/notification-preferences/:id',
    {
      onRequest: [verifyJwt],
      schema: v1DeleteNotificationPreferenceController.schema,
    },
    v1DeleteNotificationPreferenceController,
  );
}
