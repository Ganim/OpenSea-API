import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  AlertTypeValue,
  NotificationChannelValue,
} from '@/entities/sales/notification-preference';
import { NotificationPreference } from '@/entities/sales/notification-preference';
import type { NotificationPreference as PrismaNotificationPreference } from '@prisma/generated/client.js';

export function mapNotificationPreferencePrismaToDomain(
  preferenceDb: PrismaNotificationPreference,
) {
  return {
    id: new UniqueEntityID(preferenceDb.id),
    userId: new UniqueEntityID(preferenceDb.userId),
    alertType: preferenceDb.alertType as AlertTypeValue,
    channel: preferenceDb.channel as NotificationChannelValue,
    isEnabled: preferenceDb.isEnabled,
    createdAt: preferenceDb.createdAt,
    updatedAt: preferenceDb.updatedAt,
  };
}

export function notificationPreferencePrismaToDomain(
  preferenceDb: PrismaNotificationPreference,
): NotificationPreference {
  return NotificationPreference.create(
    mapNotificationPreferencePrismaToDomain(preferenceDb),
    new UniqueEntityID(preferenceDb.id),
  );
}
