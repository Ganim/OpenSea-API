import { PrismaNotificationPreferencesRepository } from '@/repositories/sales/prisma/prisma-notification-preferences-repository';
import { GetNotificationPreferenceUseCase } from '../get-notification-preference';

export function makeGetNotificationPreferenceUseCase() {
  const notificationPreferencesRepository =
    new PrismaNotificationPreferencesRepository();
  return new GetNotificationPreferenceUseCase(notificationPreferencesRepository);
}
