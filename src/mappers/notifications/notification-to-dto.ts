import type { Notification } from '@/entities/notifications/notification';

export interface NotificationDTO {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS' | 'REMINDER';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  channel: 'IN_APP' | 'EMAIL' | 'SMS' | 'PUSH';
  actionUrl?: string | null;
  actionText?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  isRead: boolean;
  isSent: boolean;
  scheduledFor?: Date | null;
  readAt?: Date | null;
  sentAt?: Date | null;
  createdAt: Date;
  updatedAt?: Date | null;
  deletedAt?: Date | null;
}

export function notificationToDTO(notification: Notification): NotificationDTO {
  return {
    id: notification.id.toString(),
    userId: notification.userId.toString(),
    title: notification.title,
    message: notification.message,
    type: notification.type,
    priority: notification.priority,
    channel: notification.channel,
    actionUrl: notification.actionUrl ?? null,
    actionText: notification.actionText ?? null,
    entityType: notification.entityType ?? null,
    entityId: notification.entityId ?? null,
    isRead: notification.isRead,
    isSent: notification.isSent,
    scheduledFor: notification.scheduledFor ?? null,
    readAt: notification.readAt ?? null,
    sentAt: notification.sentAt ?? null,
    createdAt: notification.createdAt,
    updatedAt: notification.updatedAt ?? null,
    deletedAt: notification.deletedAt ?? null,
  };
}
