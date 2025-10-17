import { PrismaNotificationPreferencesRepository } from '@/repositories/sales/prisma/prisma-notification-preferences-repository';
import { ListNotificationPreferencesByUserUseCase } from '../list-notification-preferences-by-user';

export function makeListNotificationPreferencesByUserUseCase() {
  const notificationPreferencesRepository =
    new PrismaNotificationPreferencesRepository();
  return new ListNotificationPreferencesByUserUseCase(
    notificationPreferencesRepository,
  );
}
