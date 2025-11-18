import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Notification } from '@/entities/notifications/notification';
import { prisma } from '@/lib/prisma';
import { notificationPrismaToDomain } from '@/mappers/notifications/notification-prisma-to-domain';
import type {
  Prisma,
  NotificationChannel as PrismaNotificationChannel,
  NotificationPriority as PrismaNotificationPriority,
  NotificationType as PrismaNotificationType,
} from '@prisma/client';
import type {
  CreateNotificationSchema,
  ListNotificationsFilter,
  NotificationsRepository,
} from '../notifications-repository';

export class PrismaNotificationsRepository implements NotificationsRepository {
  async create(data: CreateNotificationSchema): Promise<Notification> {
    const created = await prisma.notification.create({
      data: {
        userId: data.userId.toString(),
        title: data.title,
        message: data.message,
        type: data.type as PrismaNotificationType,
        priority: (data.priority ?? 'NORMAL') as PrismaNotificationPriority,
        channel: data.channel as PrismaNotificationChannel,
        actionUrl: data.actionUrl,
        actionText: data.actionText,
        entityType: data.entityType,
        entityId: data.entityId,
        scheduledFor: data.scheduledFor,
      },
    });

    return notificationPrismaToDomain(created);
  }

  async findById(id: UniqueEntityID): Promise<Notification | null> {
    const found = await prisma.notification.findUnique({
      where: { id: id.toString() },
    });
    if (!found) return null;
    return notificationPrismaToDomain(found);
  }

  async list(
    filter: ListNotificationsFilter,
  ): Promise<{ data: Notification[]; total: number }> {
    const where: Prisma.NotificationWhereInput = {
      userId: filter.userId.toString(),
      deletedAt: null,
    };

    if (typeof filter.isRead === 'boolean') where.isRead = filter.isRead;
    if (filter.type) where.type = filter.type as PrismaNotificationType;
    if (filter.channel)
      where.channel = filter.channel as PrismaNotificationChannel;
    if (filter.priority)
      where.priority = filter.priority as PrismaNotificationPriority;
    if (filter.startDate || filter.endDate) {
      where.createdAt = {};
      if (filter.startDate) where.createdAt.gte = filter.startDate;
      if (filter.endDate) where.createdAt.lte = filter.endDate;
    }

    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;

    const [rows, total] = await prisma.$transaction([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notification.count({ where }),
    ]);

    return { data: rows.map(notificationPrismaToDomain), total };
  }

  async markAsRead(id: UniqueEntityID): Promise<void> {
    await prisma.notification.update({
      where: { id: id.toString() },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllAsRead(userId: UniqueEntityID): Promise<number> {
    const result = await prisma.notification.updateMany({
      where: { userId: userId.toString(), isRead: false, deletedAt: null },
      data: { isRead: true, readAt: new Date() },
    });
    return result.count;
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.notification.update({
      where: { id: id.toString() },
      data: { deletedAt: new Date() },
    });
  }

  async save(notification: Notification): Promise<void> {
    await prisma.notification.update({
      where: { id: notification.id.toString() },
      data: {
        title: notification.title,
        message: notification.message,
        type: notification.type as PrismaNotificationType,
        priority: notification.priority as PrismaNotificationPriority,
        channel: notification.channel as PrismaNotificationChannel,
        actionUrl: notification.actionUrl,
        actionText: notification.actionText,
        entityType: notification.entityType,
        entityId: notification.entityId,
        isRead: notification.isRead,
        isSent: notification.isSent,
        scheduledFor: notification.scheduledFor,
        readAt: notification.readAt,
        sentAt: notification.sentAt,
        updatedAt: new Date(),
        deletedAt: notification.deletedAt,
      },
    });
  }
}
