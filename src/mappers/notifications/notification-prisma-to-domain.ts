import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
    NotificationChannelValue,
    NotificationPriorityValue,
    NotificationTypeValue,
} from '@/entities/notifications/notification';
import { Notification } from '@/entities/notifications/notification';
import type { Notification as PrismaNotification } from '@prisma/client';

export function mapNotificationPrismaToDomain(model: PrismaNotification) {
  return {
    id: new UniqueEntityID(model.id),
    userId: new UniqueEntityID(model.userId),
    title: model.title,
    message: model.message,
    type: model.type as NotificationTypeValue,
    priority: model.priority as NotificationPriorityValue,
    channel: model.channel as NotificationChannelValue,
    actionUrl: model.actionUrl ?? undefined,
    actionText: model.actionText ?? undefined,
    entityType: model.entityType ?? undefined,
    entityId: model.entityId ?? undefined,
    isRead: model.isRead,
    isSent: model.isSent,
    scheduledFor: model.scheduledFor ?? undefined,
    readAt: model.readAt ?? undefined,
    sentAt: model.sentAt ?? undefined,
    createdAt: model.createdAt,
    updatedAt: model.updatedAt,
    deletedAt: model.deletedAt ?? undefined,
  };
}

export function notificationPrismaToDomain(
  model: PrismaNotification,
): Notification {
  return Notification.create(
    mapNotificationPrismaToDomain(model),
    new UniqueEntityID(model.id),
  );
}
