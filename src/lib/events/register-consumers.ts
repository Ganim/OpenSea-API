/**
 * Event consumer registration.
 *
 * Registers all cross-module event consumers with the TypedEventBus.
 * Called during application bootstrap in server.ts.
 */

import {
  stockOrderReservationConsumer,
  stockOrderCancellationConsumer,
} from './consumers/stock-consumer';
import { crmTimelineConsumer } from './consumers/crm-consumer';
import { notificationConsumer } from './consumers/notification-consumer';
import type { TypedEventBus } from './typed-event-bus';

export function registerEventConsumers(eventBus: TypedEventBus): void {
  // Stock module — item reservations on order confirm/cancel
  eventBus.register(stockOrderReservationConsumer);
  eventBus.register(stockOrderCancellationConsumer);

  // CRM module — timeline events for deal and order activity
  eventBus.register(crmTimelineConsumer);

  // Notifications module — in-app alerts for high-priority events
  eventBus.register(notificationConsumer);
}
