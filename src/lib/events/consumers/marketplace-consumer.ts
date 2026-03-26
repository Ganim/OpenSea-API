/**
 * Marketplace module event consumer.
 *
 * Creates in-app notifications when marketplace orders are imported,
 * alerting the tenant about new incoming orders from external channels.
 */

import type { DomainEvent, EventConsumer } from '../domain-event.interface';
import { SALES_EVENTS } from '../sales-events';
import type { MarketplaceOrderImportedData } from '../sales-events';

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
 * Lazily load the Notifications repository.
 */
function getNotificationsRepository() {
  const {
    PrismaNotificationsRepository,
  } = require('@/repositories/notifications/prisma/prisma-notifications-repository'); // eslint-disable-line @typescript-eslint/no-require-imports
  return new PrismaNotificationsRepository();
}

/**
 * Format a currency value as BRL string.
 */
function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export const marketplaceOrderImportConsumer: EventConsumer = {
  consumerId: 'marketplace.order-import-handler',
  moduleId: 'sales',
  subscribesTo: [SALES_EVENTS.MARKETPLACE_ORDER_IMPORTED],

  async handle(event: DomainEvent): Promise<void> {
    const data = event.data as unknown as MarketplaceOrderImportedData;
    const { externalOrderId, marketplace, buyerName, total } = data;

    const userId = event.metadata?.userId;
    if (!userId) {
      getLogger().warn(
        { eventId: event.id, type: event.type },
        '[MarketplaceConsumer] Evento sem userId - notificacao nao criada',
      );
      return;
    }

    getLogger().info(
      { externalOrderId, marketplace, buyerName, total, eventId: event.id },
      `[MarketplaceConsumer] Criando notificacao para pedido importado ${marketplace} #${externalOrderId}`,
    );

    try {
      const notificationsRepo = getNotificationsRepository();
      const { UniqueEntityID } = await import(
        '@/entities/domain/unique-entity-id'
      );

      const notificationTitle = `Novo pedido ${marketplace}`;
      const notificationMessage = `Pedido ${externalOrderId} de ${buyerName} \u2014 ${formatBRL(total)}`;

      await notificationsRepo.create({
        userId: new UniqueEntityID(userId),
        title: notificationTitle,
        message: notificationMessage,
        type: 'INFO',
        priority: 'NORMAL',
        channel: 'IN_APP' as const,
        entityType: 'order',
        entityId: data.orderId,
        actionUrl: `/sales/orders/${data.orderId}`,
        metadata: {
          sourceEventId: event.id,
          sourceEventType: event.type,
          tenantId: event.tenantId,
          marketplace,
          externalOrderId,
        },
      });

      getLogger().info(
        { externalOrderId, marketplace, eventId: event.id },
        `[MarketplaceConsumer] Notificacao criada para pedido ${marketplace} #${externalOrderId}`,
      );
    } catch (err) {
      getLogger().error(
        { externalOrderId, marketplace, eventId: event.id, error: err },
        '[MarketplaceConsumer] Falha ao criar notificacao para pedido importado',
      );
      throw err; // Re-throw to trigger retry
    }
  },
};
