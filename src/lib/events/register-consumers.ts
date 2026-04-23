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
import { punchEsocialConsumer } from './consumers/punch-esocial-consumer';
import { punchEventsQueueBridge } from './consumers/punch-events-queue-bridge';
import { punchNotificationDispatcherConsumer } from './consumers/punch-notification-dispatcher-consumer';
import { receiptPdfDispatcherConsumer } from './consumers/receipt-pdf-dispatcher-consumer';
import { punchPayrollConsumer } from './consumers/punch-payroll-consumer';
import { punchPinLockedDispatcherConsumer } from './consumers/punch-pin-locked-dispatcher-consumer';
import { punchQrRotationCompletedDispatcherConsumer } from './consumers/punch-qr-rotation-completed-dispatcher-consumer';
import { punchTimebankConsumer } from './consumers/punch-timebank-consumer';
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

  // Punch module (Phase 4) — stub consumers for payroll/timebank/esocial.
  // Real work is implemented in phase 6/7 (payroll), 7 (timebank), 6 (esocial).
  eventBus.register(punchPayrollConsumer);
  eventBus.register(punchTimebankConsumer);
  eventBus.register(punchEsocialConsumer);

  // Punch module (Phase 4) — REAL bridge to notifications v2.
  // Subscribes to TIME_ENTRY_CREATED + APPROVAL_REQUESTED and routes them
  // to `notificationClient.dispatch(...)` using categories declared in
  // `punch.manifest.ts` (punch.registered, punch.approval_requested).
  // Phase 5 hardened this consumer with D-16 VAPID graceful degrade:
  // when the tenant has no Web Push subscriptions, `punch.registered`
  // is emitted with channels overridden to [IN_APP] only.
  eventBus.register(punchNotificationDispatcherConsumer);

  // Punch module (Phase 5, D-11) — PIN_LOCKED → admin notification.
  // Subscribes to PUNCH_EVENTS.PIN_LOCKED and dispatches an ACTIONABLE
  // punch.pin_locked notification to every user with the
  // hr.punch-devices.admin permission in the tenant.
  eventBus.register(punchPinLockedDispatcherConsumer);

  // Punch module (Phase 5, D-14) — QR_ROTATION_COMPLETED → invoker + admins.
  // Subscribes to PUNCH_EVENTS.QR_ROTATION_COMPLETED. Primary dispatch
  // targets the admin who invoked the rotation; secondary broadcast to
  // hr.punch-devices.admin fires ONLY when processed > 50 (T-QR-01
  // information-disclosure mitigation — suppress individual-rotation
  // broadcasts to avoid spam).
  eventBus.register(punchQrRotationCompletedDispatcherConsumer);

  // Punch module (Phase 4) — durable BullMQ fan-out (AD-02).
  // Subscribes to EVERY punch.* event and forwards it as a job to the
  // `punch-events` BullMQ queue so heavy handlers (payroll, timebank,
  // eSocial) can run out-of-process in later phases. The bridge is the
  // SINGLE producer of that queue — use cases never call addJob directly.
  eventBus.register(punchEventsQueueBridge);

  // Compliance (Phase 6, Plan 06-03) — subscreve TIME_ENTRY_CREATED e
  // enfileira 1 job em `receipt-pdf-generation` com jobId=timeEntryId.
  // Queue DEDICADA (não reusa punch-events) para que o worker de recibo
  // possa ter SLA/retry/priority próprios — < 5s por recibo.
  eventBus.register(receiptPdfDispatcherConsumer);
}
