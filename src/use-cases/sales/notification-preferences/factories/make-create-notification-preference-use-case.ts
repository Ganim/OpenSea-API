import { PrismaNotificationPreferencesRepository } from '@/repositories/sales/prisma/prisma-notification-preferences-repository';
import { CreateNotificationPreferenceUseCase } from '../create-notification-preference';

export function makeCreateNotificationPreferenceUseCase() {
  const notificationPreferencesRepository =
    new PrismaNotificationPreferencesRepository();
  return new CreateNotificationPreferenceUseCase(
    notificationPreferencesRepository,
  );
}
