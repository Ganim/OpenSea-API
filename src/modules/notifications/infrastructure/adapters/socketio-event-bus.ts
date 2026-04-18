/**
 * Socket.IO-backed notification event bus.
 * Broadcasts to room `user:{userId}` which every authenticated browser
 * socket joins on connection (see lib/websocket/socket-server.ts).
 */

import { emitToUser } from '@/lib/websocket/socket-server.js';

import type {
  NotificationCancelledEvent,
  NotificationCreatedEvent,
  NotificationEventBus,
  NotificationProgressEvent,
  NotificationResolvedEvent,
  NotificationUpdatedEvent,
} from '../../dispatcher/notification-event-bus.js';

export class SocketIONotificationEventBus implements NotificationEventBus {
  publishCreated(event: NotificationCreatedEvent): void {
    emitToUser(event.userId, 'notification:new', {
      notificationId: event.notificationId,
      tenantId: event.tenantId,
    });
  }

  publishUpdated(event: NotificationUpdatedEvent): void {
    emitToUser(event.userId, 'notification:updated', {
      notificationId: event.notificationId,
      tenantId: event.tenantId,
    });
  }

  publishResolved(event: NotificationResolvedEvent): void {
    emitToUser(event.userId, 'notification:resolved', {
      notificationId: event.notificationId,
      tenantId: event.tenantId,
      action: event.action,
      state: event.state,
    });
  }

  publishProgress(event: NotificationProgressEvent): void {
    emitToUser(event.userId, 'notification:progress', {
      notificationId: event.notificationId,
      progress: event.progress,
      total: event.total,
      message: event.message,
      completed: event.completed,
    });
  }

  publishCancelled(event: NotificationCancelledEvent): void {
    emitToUser(event.userId, 'notification:cancelled', {
      notificationId: event.notificationId,
    });
  }
}
