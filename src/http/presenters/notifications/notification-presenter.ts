import type { Notification } from '@/entities/notifications/notification';
import { notificationToDTO } from '@/mappers/notifications/notification-to-dto';

export class NotificationPresenter {
  static toHTTP(notification: Notification) {
    return notificationToDTO(notification);
  }

  static toHTTPMany(notifications: Notification[]) {
    return notifications.map((n) => this.toHTTP(n));
  }
}
