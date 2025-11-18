import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
    NotificationChannelValue,
    NotificationPriorityValue,
} from '@/entities/notifications/notification';
import { NotificationTemplate } from '@/entities/notifications/notification-template';
import type { NotificationTemplate as PrismaNotificationTemplate } from '@prisma/client';

export function mapNotificationTemplatePrismaToDomain(
  model: PrismaNotificationTemplate,
) {
  return {
    id: new UniqueEntityID(model.id),
    code: model.code,
    name: model.name,
    titleTemplate: model.titleTemplate,
    messageTemplate: model.messageTemplate,
    defaultChannel: model.defaultChannel as NotificationChannelValue,
    defaultPriority: model.defaultPriority as NotificationPriorityValue,
    isActive: model.isActive,
    createdAt: model.createdAt,
    updatedAt: model.updatedAt,
    deletedAt: model.deletedAt ?? undefined,
  };
}

export function notificationTemplatePrismaToDomain(
  model: PrismaNotificationTemplate,
): NotificationTemplate {
  return NotificationTemplate.create(
    mapNotificationTemplatePrismaToDomain(model),
    new UniqueEntityID(model.id),
  );
}
