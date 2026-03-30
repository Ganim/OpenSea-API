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
import {
  financeOrderPaymentConsumer,
  financePixPaymentConsumer,
  financeOrderConfirmedConsumer,
} from './consumers/finance-consumer';
import { marketplaceOrderImportConsumer } from './consumers/marketplace-consumer';
import { dealWonOrderCreationConsumer } from './consumers/deal-won-consumer';
import { messagingNotificationConsumer } from './consumers/messaging-notification-consumer';
import type { TypedEventBus } from './typed-event-bus';

export function registerEventConsumers(eventBus: TypedEventBus): void {
  // Stock module — item reservations on order confirm/cancel
  eventBus.register(stockOrderReservationConsumer);
  eventBus.register(stockOrderCancellationConsumer);

  // CRM module — timeline events for deal and order activity
  eventBus.register(crmTimelineConsumer);

  // Notifications module — in-app alerts for high-priority events
  eventBus.register(notificationConsumer);

  // Finance module — auto-create entries on order confirm, payment and PIX receipt
  eventBus.register(financeOrderConfirmedConsumer);
  eventBus.register(financeOrderPaymentConsumer);
  eventBus.register(financePixPaymentConsumer);

  // Marketplace module — notifications for imported marketplace orders
  eventBus.register(marketplaceOrderImportConsumer);

  // Sales module — auto-create draft orders when deals are won
  eventBus.register(dealWonOrderCreationConsumer);

  // Messaging module — send WhatsApp/Telegram notifications for order events
  eventBus.register(messagingNotificationConsumer);
}
