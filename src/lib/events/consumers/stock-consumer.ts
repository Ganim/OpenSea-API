/**
 * Stock module event consumer.
 *
 * Handles stock reservations and releases in response to order events.
 * When an order is confirmed, reserves items in stock.
 * When an order is cancelled, releases the reservations.
 */

import type { DomainEvent, EventConsumer } from '../domain-event.interface';
import { SALES_EVENTS } from '../sales-events';
import type { OrderConfirmedData, OrderCancelledData } from '../sales-events';

// Lazy logger to avoid @env initialization in unit tests
let _logger: {
  info: (obj: unknown, msg: string) => void;
  warn: (obj: unknown, msg: string) => void;
  error: (obj: unknown, msg: string) => void;
} | null = null;
function getLogger() {
  if (!_logger) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      _logger = require('@/lib/logger').logger;
    } catch {
      _logger = {
        info: (obj, msg) => console.log(msg, obj),
        warn: (obj, msg) => console.warn(msg, obj),
        error: (obj, msg) => console.error(msg, obj),
      };
    }
  }
  return _logger!;
}

/**
 * Lazily load Prisma repositories to avoid circular imports
 * and @env initialization during unit tests.
 */
function getItemReservationsRepository() {
  const {
    PrismaItemReservationsRepository,
  } = require('@/repositories/sales/prisma/prisma-item-reservations-repository');
  return new PrismaItemReservationsRepository();
}

function getOrderItemsRepository() {
  const {
    PrismaOrderItemsRepository,
  } = require('@/repositories/sales/prisma/prisma-order-items-repository');
  return new PrismaOrderItemsRepository();
}

export const stockOrderReservationConsumer: EventConsumer = {
  consumerId: 'stock.order-reservation-handler',
  moduleId: 'stock',
  subscribesTo: [SALES_EVENTS.ORDER_CONFIRMED],

  async handle(event: DomainEvent): Promise<void> {
    const data = event.data as unknown as OrderConfirmedData;
    const { orderId, items, total } = data;

    getLogger().info(
      { orderId, itemCount: items?.length ?? 0, total, eventId: event.id },
      `[StockConsumer] Reservando itens para pedido confirmado #${orderId}`,
    );

    if (!items || items.length === 0) {
      getLogger().warn(
        { orderId, eventId: event.id },
        '[StockConsumer] Pedido confirmado sem itens - nenhuma reserva criada',
      );
      return;
    }

    try {
      const reservationsRepo = getItemReservationsRepository();
      const { UniqueEntityID } = await import(
        '@/entities/domain/unique-entity-id'
      );

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7-day reservation window

      for (const item of items) {
        try {
          await reservationsRepo.create({
            itemId: new UniqueEntityID(item.variantId),
            userId: new UniqueEntityID(event.metadata?.userId ?? 'system'),
            quantity: item.quantity,
            reason: `Pedido confirmado #${orderId}`,
            reference: orderId,
            expiresAt,
          });

          getLogger().info(
            { variantId: item.variantId, quantity: item.quantity, orderId },
            `[StockConsumer] Reservado ${item.quantity} unidades do variante ${item.variantId} para pedido #${orderId}`,
          );
        } catch (err) {
          // Log individual item reservation failure but continue with others
          getLogger().error(
            { variantId: item.variantId, orderId, error: err },
            `[StockConsumer] Falha ao reservar variante ${item.variantId} para pedido #${orderId}`,
          );
        }
      }
    } catch (err) {
      getLogger().error(
        { orderId, eventId: event.id, error: err },
        '[StockConsumer] Falha ao processar reservas para pedido confirmado',
      );
      throw err; // Re-throw to trigger retry
    }
  },
};

export const stockOrderCancellationConsumer: EventConsumer = {
  consumerId: 'stock.order-cancellation-handler',
  moduleId: 'stock',
  subscribesTo: [SALES_EVENTS.ORDER_CANCELLED],

  async handle(event: DomainEvent): Promise<void> {
    const data = event.data as unknown as OrderCancelledData;
    const { orderId, reason } = data;

    getLogger().info(
      { orderId, reason, eventId: event.id },
      `[StockConsumer] Liberando reservas para pedido cancelado #${orderId}`,
    );

    try {
      const reservationsRepo = getItemReservationsRepository();
      const { UniqueEntityID } = await import(
        '@/entities/domain/unique-entity-id'
      );

      // Find all active reservations referencing this order
      // The reference field stores the orderId for order-based reservations
      const orderItemsRepo = getOrderItemsRepository();
      const orderItems = await orderItemsRepo.findManyByOrder(
        new UniqueEntityID(orderId),
        event.tenantId,
      );

      let releasedCount = 0;
      for (const item of orderItems) {
        if (!item.variantId) continue;

        const activeReservations = await reservationsRepo.findManyActive(
          item.variantId,
        );

        // Release reservations that reference this order
        for (const reservation of activeReservations) {
          if (reservation.reference === orderId) {
            reservation.release();
            await reservationsRepo.save(reservation);
            releasedCount++;
          }
        }
      }

      getLogger().info(
        { orderId, releasedCount, eventId: event.id },
        `[StockConsumer] Reservas liberadas para pedido #${orderId} (${releasedCount} reservas)`,
      );
    } catch (err) {
      getLogger().error(
        { orderId, eventId: event.id, error: err },
        '[StockConsumer] Falha ao liberar reservas para pedido cancelado',
      );
      throw err; // Re-throw to trigger retry
    }
  },
};
