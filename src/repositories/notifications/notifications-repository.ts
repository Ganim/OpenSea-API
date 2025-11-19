import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  Notification,
  NotificationChannelValue,
  NotificationPriorityValue,
  NotificationTypeValue,
} from '@/entities/notifications/notification';

export interface CreateNotificationSchema {
  userId: UniqueEntityID;
  title: string;
  message: string;
  type: NotificationTypeValue;
  priority?: NotificationPriorityValue;
  channel: NotificationChannelValue;
  actionUrl?: string;
  actionText?: string;
  entityType?: string;
  entityId?: string;
  scheduledFor?: Date;
}

export interface ListNotificationsFilter {
  userId: UniqueEntityID;
  isRead?: boolean;
  type?: NotificationTypeValue;
  channel?: NotificationChannelValue;
  priority?: NotificationPriorityValue;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export interface NotificationsRepository {
  create(data: CreateNotificationSchema): Promise<Notification>;
  findById(id: UniqueEntityID): Promise<Notification | null>;
  list(
    filter: ListNotificationsFilter,
  ): Promise<{ data: Notification[]; total: number }>;
  listScheduledPending(now: Date, limit?: number): Promise<Notification[]>; // scheduledFor <= now AND isSent = false
  markAsRead(id: UniqueEntityID): Promise<void>;
  markAllAsRead(userId: UniqueEntityID): Promise<number>; // returns affected count
  delete(id: UniqueEntityID): Promise<void>; // soft delete
  save(notification: Notification): Promise<void>;
}
