/**
 * Notification module event consumer.
 *
 * Sends in-app notifications for important cross-module events
 * such as order confirmations, deal wins, and campaign activations.
 */

import type { DomainEvent, EventConsumer } from '../domain-event.interface';
import { SALES_EVENTS } from '../sales-events';
import type {
  DealWonData,
  OrderConfirmedData,
  OrderCancelledData,
  CampaignActivatedData,
} from '../sales-events';

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

interface NotificationPayload {
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  entityType: string;
  entityId: string;
  actionUrl?: string;
}

/**
 * Build notification payload from a domain event.
 */
function buildNotificationPayload(
  event: DomainEvent,
): NotificationPayload | null {
  switch (event.type) {
    case SALES_EVENTS.DEAL_WON: {
      const data = event.data as unknown as DealWonData;
      const valueStr = data.value ? ` (${formatBRL(data.value)})` : '';
      return {
        title: 'Deal ganho!',
        message: `Um deal foi marcado como ganho${valueStr}`,
        type: 'SUCCESS',
        priority: 'HIGH',
        entityType: 'deal',
        entityId: data.dealId,
        actionUrl: `/sales/deals/${data.dealId}`,
      };
    }
    case SALES_EVENTS.ORDER_CONFIRMED: {
      const data = event.data as unknown as OrderConfirmedData;
      const valueStr = data.total ? ` - ${formatBRL(data.total)}` : '';
      return {
        title: 'Pedido confirmado',
        message: `Pedido #${data.orderId.slice(0, 8)} foi confirmado${valueStr}`,
        type: 'SUCCESS',
        priority: 'NORMAL',
        entityType: 'order',
        entityId: data.orderId,
        actionUrl: `/sales/orders/${data.orderId}`,
      };
    }
    case SALES_EVENTS.ORDER_CANCELLED: {
      const data = event.data as unknown as OrderCancelledData;
      const reasonStr = data.reason ? ` - Motivo: ${data.reason}` : '';
      return {
        title: 'Pedido cancelado',
        message: `Pedido #${data.orderId.slice(0, 8)} foi cancelado${reasonStr}`,
        type: 'WARNING',
        priority: 'HIGH',
        entityType: 'order',
        entityId: data.orderId,
        actionUrl: `/sales/orders/${data.orderId}`,
      };
    }
    case SALES_EVENTS.CAMPAIGN_ACTIVATED: {
      const data = event.data as unknown as CampaignActivatedData;
      return {
        title: 'Campanha ativada',
        message: `Campanha ${data.campaignId.slice(0, 8)} foi ativada com ${data.products.length} produtos`,
        type: 'INFO',
        priority: 'NORMAL',
        entityType: 'campaign',
        entityId: data.campaignId,
        actionUrl: `/sales/campaigns/${data.campaignId}`,
      };
    }
    default:
      return null;
  }
}

export const notificationConsumer: EventConsumer = {
  consumerId: 'notifications.alert-handler',
  moduleId: 'notifications',
  subscribesTo: [
    SALES_EVENTS.DEAL_WON,
    SALES_EVENTS.ORDER_CONFIRMED,
    SALES_EVENTS.ORDER_CANCELLED,
    SALES_EVENTS.CAMPAIGN_ACTIVATED,
  ],

  async handle(event: DomainEvent): Promise<void> {
    const payload = buildNotificationPayload(event);

    if (!payload) {
      getLogger().warn(
        { eventId: event.id, type: event.type },
        '[NotificationConsumer] Tipo de evento sem payload de notificacao mapeado',
      );
      return;
    }

    const userId = event.metadata?.userId;
    if (!userId) {
      getLogger().warn(
        { eventId: event.id, type: event.type },
        '[NotificationConsumer] Evento sem userId - notificacao nao criada',
      );
      return;
    }

    getLogger().info(
      { eventId: event.id, type: event.type, userId, title: payload.title },
      `[NotificationConsumer] Criando notificacao: ${payload.title}`,
    );

    try {
      const notificationsRepo = getNotificationsRepository();
      const { UniqueEntityID } = await import(
        '@/entities/domain/unique-entity-id'
      );

      await notificationsRepo.create({
        userId: new UniqueEntityID(userId),
        title: payload.title,
        message: payload.message,
        type: payload.type,
        priority: payload.priority,
        channel: 'IN_APP' as const,
        entityType: payload.entityType,
        entityId: payload.entityId,
        actionUrl: payload.actionUrl,
        metadata: {
          sourceEventId: event.id,
          sourceEventType: event.type,
          tenantId: event.tenantId,
        },
      });

      getLogger().info(
        { eventId: event.id, userId },
        `[NotificationConsumer] Notificacao criada para usuario ${userId}`,
      );
    } catch (err) {
      getLogger().error(
        { eventId: event.id, userId, error: err },
        '[NotificationConsumer] Falha ao criar notificacao',
      );
      throw err; // Re-throw to trigger retry
    }
  },
};
