import { PrismaNotificationPreferencesRepository } from '@/repositories/sales/prisma/prisma-notification-preferences-repository';
import { UpdateNotificationPreferenceUseCase } from '../update-notification-preference';

export function makeUpdateNotificationPreferenceUseCase() {
  const notificationPreferencesRepository =
    new PrismaNotificationPreferencesRepository();
  return new UpdateNotificationPreferenceUseCase(
    notificationPreferencesRepository,
  );
}
