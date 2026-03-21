/**
 * Events module barrel export.
 *
 * Re-exports all public event infrastructure for convenient imports.
 */

export type { DomainEvent, EventConsumer } from './domain-event.interface';
export { SALES_EVENTS } from './sales-events';
export type {
  CampaignActivatedData,
  ContactCreatedData,
  DealCreatedData,
  DealLostData,
  DealWonData,
  OrderCancelledData,
  OrderConfirmedData,
  PriceTableUpdatedData,
  SalesEventType,
  StageChangedData,
} from './sales-events';
export {
  TypedEventBus,
  getTypedEventBus,
  setTypedEventBus,
} from './typed-event-bus';
export type { TypedEventBusOptions } from './typed-event-bus';

// Consumer registration
export { registerEventConsumers } from './register-consumers';

// Consumers
export { crmTimelineConsumer } from './consumers/crm-consumer';
export { notificationConsumer } from './consumers/notification-consumer';
export {
  stockOrderCancellationConsumer,
  stockOrderReservationConsumer,
} from './consumers/stock-consumer';
