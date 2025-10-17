import { PrismaNotificationPreferencesRepository } from '@/repositories/sales/prisma/prisma-notification-preferences-repository';
import { DeleteNotificationPreferenceUseCase } from '../delete-notification-preference';

export function makeDeleteNotificationPreferenceUseCase() {
  const notificationPreferencesRepository =
    new PrismaNotificationPreferencesRepository();
  return new DeleteNotificationPreferenceUseCase(
    notificationPreferencesRepository,
  );
}
