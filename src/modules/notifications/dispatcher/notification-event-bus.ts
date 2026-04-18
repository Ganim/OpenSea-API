/**
 * Event bus for real-time notification updates.
 *
 * Phase 2 ships a simple in-memory emitter (logs only). Phase 3 replaces
 * it with a Socket.IO-backed implementation that broadcasts to
 * `user:{userId}` rooms.
 */

import { logger } from '@/lib/logger.js';

export interface NotificationCreatedEvent {
  tenantId: string;
  userId: string;
  notificationId: string;
}

export interface NotificationUpdatedEvent {
  tenantId: string;
  userId: string;
  notificationId: string;
}

export interface NotificationResolvedEvent {
  tenantId: string;
  userId: string;
  notificationId: string;
  action: string;
  state: 'RESOLVED' | 'DECLINED';
}

export interface NotificationProgressEvent {
  tenantId: string;
  userId: string;
  notificationId: string;
  progress: number;
  total?: number;
  message?: string;
  completed: boolean;
}

export interface NotificationCancelledEvent {
  tenantId: string;
  userId: string;
  notificationId: string;
}

export interface NotificationEventBus {
  publishCreated(event: NotificationCreatedEvent): void;
  publishUpdated(event: NotificationUpdatedEvent): void;
  publishResolved(event: NotificationResolvedEvent): void;
  publishProgress(event: NotificationProgressEvent): void;
  publishCancelled(event: NotificationCancelledEvent): void;
}

export class InMemoryNotificationEventBus implements NotificationEventBus {
  publishCreated(event: NotificationCreatedEvent): void {
    logger?.debug?.({ event }, '[notifications] created (in-memory stub)');
  }
  publishUpdated(event: NotificationUpdatedEvent): void {
    logger?.debug?.({ event }, '[notifications] updated (in-memory stub)');
  }
  publishResolved(event: NotificationResolvedEvent): void {
    logger?.debug?.({ event }, '[notifications] resolved (in-memory stub)');
  }
  publishProgress(event: NotificationProgressEvent): void {
    logger?.debug?.({ event }, '[notifications] progress (in-memory stub)');
  }
  publishCancelled(event: NotificationCancelledEvent): void {
    logger?.debug?.({ event }, '[notifications] cancelled (in-memory stub)');
  }
}
