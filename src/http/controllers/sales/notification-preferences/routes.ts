import type { FastifyInstance } from 'fastify';
import { createNotificationPreferenceController } from './v1-create-notification-preference.controller';
import { deleteNotificationPreferenceController } from './v1-delete-notification-preference.controller';
import { listNotificationPreferencesByUserController } from './v1-list-notification-preferences-by-user.controller';
import { updateNotificationPreferenceController } from './v1-update-notification-preference.controller';

export async function notificationPreferencesRoutes(app: FastifyInstance) {
  await app.register(listNotificationPreferencesByUserController);
  await app.register(createNotificationPreferenceController);
  await app.register(updateNotificationPreferenceController);
  await app.register(deleteNotificationPreferenceController);
}
