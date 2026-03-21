/**
 * Stock module event consumer — placeholder.
 *
 * Handles stock reservations and releases in response to order events.
 * Implementation will be filled in when the Orders module is fully integrated.
 */

import type { DomainEvent, EventConsumer } from '../domain-event.interface';
import { SALES_EVENTS } from '../sales-events';

// Lazy logger to avoid @env initialization in unit tests
let _logger: { info: (obj: unknown, msg: string) => void } | null = null;
function getLogger() {
  if (!_logger) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      _logger = require('@/lib/logger').logger;
    } catch {
      _logger = { info: (obj, msg) => console.log(msg, obj) };
    }
  }
  return _logger!;
}

export const stockOrderReservationConsumer: EventConsumer = {
  consumerId: 'stock.order-reservation-handler',
  moduleId: 'stock',
  subscribesTo: [SALES_EVENTS.ORDER_CONFIRMED],

  async handle(event: DomainEvent): Promise<void> {
    const { orderId, items } = event.data as {
      orderId: string;
      items: Array<{ variantId: string; quantity: number }>;
    };

    getLogger().info(
      { orderId, itemCount: items?.length ?? 0, eventId: event.id },
      '[StockConsumer] Placeholder: reserve items for confirmed order',
    );

    // TODO: Implement actual stock reservation
    // await reserveItemsForOrder(orderId, items)
  },
};

export const stockOrderCancellationConsumer: EventConsumer = {
  consumerId: 'stock.order-cancellation-handler',
  moduleId: 'stock',
  subscribesTo: [SALES_EVENTS.ORDER_CANCELLED],

  async handle(event: DomainEvent): Promise<void> {
    const { orderId } = event.data as { orderId: string };

    getLogger().info(
      { orderId, eventId: event.id },
      '[StockConsumer] Placeholder: release reservations for cancelled order',
    );

    // TODO: Implement actual stock reservation release
    // await releaseReservationsForOrder(orderId)
  },
};
