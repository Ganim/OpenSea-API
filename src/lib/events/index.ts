/**
 * Events module barrel export.
 *
 * Re-exports all public event infrastructure for convenient imports.
 */

export type { DomainEvent, EventConsumer } from './domain-event.interface';

// Sales events
export { SALES_EVENTS } from './sales-events';
export type {
  CampaignActivatedData,
  ContactCreatedData,
  DealCreatedData,
  DealLostData,
  DealWonData,
  MarketplaceOrderImportedData,
  OrderCancelledData,
  OrderConfirmedData,
  OrderDeliveredData,
  OrderPaidData,
  OrderShippedData,
  PaymentConfirmedData,
  PaymentExpiredData,
  PaymentFailedData,
  PriceTableUpdatedData,
  SalesEventType,
  StageChangedData,
} from './sales-events';

// Finance events
export { FINANCE_EVENTS } from './finance-events';
export type {
  EntryCreatedData,
  EntryOverdueData,
  EntryPaidData,
  FinanceEventType,
  PixPaymentReceivedData,
} from './finance-events';

// Messaging events
export { MESSAGING_EVENTS } from './messaging-events';
export type {
  MessageReceivedData,
  MessageSentData,
  MessagingEventType,
} from './messaging-events';

// Event bus
export {
  getTypedEventBus,
  setTypedEventBus,
  TypedEventBus,
} from './typed-event-bus';
export type { TypedEventBusOptions } from './typed-event-bus';

// Consumer registration
export { registerEventConsumers } from './register-consumers';

// Consumers
export { crmTimelineConsumer } from './consumers/crm-consumer';
export { dealWonOrderCreationConsumer } from './consumers/deal-won-consumer';
export {
  financeOrderPaymentConsumer,
  financePixPaymentConsumer,
} from './consumers/finance-consumer';
export { marketplaceOrderImportConsumer } from './consumers/marketplace-consumer';
export { messagingNotificationConsumer } from './consumers/messaging-notification-consumer';
export { notificationConsumer } from './consumers/notification-consumer';
export {
  stockOrderCancellationConsumer,
  stockOrderReservationConsumer,
} from './consumers/stock-consumer';
