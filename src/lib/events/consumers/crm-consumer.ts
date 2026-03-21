/**
 * CRM module event consumer.
 *
 * Creates timeline events on Deals when cross-module events occur.
 * Translates domain events into human-readable timeline entries.
 */

import type { DomainEvent, EventConsumer } from '../domain-event.interface';
import { SALES_EVENTS } from '../sales-events';
import type {
  DealCreatedData,
  DealWonData,
  DealLostData,
  StageChangedData,
  OrderConfirmedData,
  OrderCancelledData,
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
 * Lazily load the TimelineEvents repository.
 */
function getTimelineEventsRepository() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaTimelineEventsRepository } = require(
    '@/repositories/sales/prisma/prisma-timeline-events-repository',
  );
  return new PrismaTimelineEventsRepository();
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

/**
 * Build a human-readable timeline title from a domain event.
 */
function buildTimelineTitle(event: DomainEvent): string {
  switch (event.type) {
    case SALES_EVENTS.DEAL_CREATED: {
      const data = event.data as unknown as DealCreatedData;
      const valueStr = data.value ? ` (${formatBRL(data.value)})` : '';
      return `Deal criado${valueStr}`;
    }
    case SALES_EVENTS.DEAL_WON: {
      const data = event.data as unknown as DealWonData;
      const valueStr = data.value ? ` (${formatBRL(data.value)})` : '';
      return `Deal ganho${valueStr}`;
    }
    case SALES_EVENTS.DEAL_LOST: {
      const data = event.data as unknown as DealLostData;
      const reasonStr = data.reason ? `: ${data.reason}` : '';
      return `Deal perdido${reasonStr}`;
    }
    case SALES_EVENTS.STAGE_CHANGED: {
      const data = event.data as unknown as StageChangedData;
      return `Deal movido de etapa (${data.fromStage} -> ${data.toStage})`;
    }
    case SALES_EVENTS.ORDER_CONFIRMED: {
      const data = event.data as unknown as OrderConfirmedData;
      const valueStr = data.total ? ` (${formatBRL(data.total)})` : '';
      return `Pedido #${data.orderId.slice(0, 8)} confirmado${valueStr}`;
    }
    case SALES_EVENTS.ORDER_CANCELLED: {
      const data = event.data as unknown as OrderCancelledData;
      const reasonStr = data.reason ? `: ${data.reason}` : '';
      return `Pedido #${data.orderId.slice(0, 8)} cancelado${reasonStr}`;
    }
    default:
      return `Evento: ${event.type}`;
  }
}

/**
 * Map domain event type to timeline event type.
 */
function mapToTimelineType(eventType: string): string {
  switch (eventType) {
    case SALES_EVENTS.DEAL_CREATED:
      return 'DEAL_CREATED';
    case SALES_EVENTS.DEAL_WON:
      return 'DEAL_WON';
    case SALES_EVENTS.DEAL_LOST:
      return 'DEAL_LOST';
    case SALES_EVENTS.STAGE_CHANGED:
      return 'STAGE_CHANGED';
    case SALES_EVENTS.ORDER_CONFIRMED:
      return 'ORDER_CONFIRMED';
    case SALES_EVENTS.ORDER_CANCELLED:
      return 'ORDER_CANCELLED';
    case SALES_EVENTS.CONTACT_CREATED:
      return 'CONTACT_CREATED';
    default:
      return 'SYSTEM_EVENT';
  }
}

/**
 * Extract dealId from event data if available.
 * Many events reference a deal directly or indirectly.
 */
function extractDealId(event: DomainEvent): string | null {
  const data = event.data as Record<string, unknown>;

  // Direct dealId in data
  if (typeof data.dealId === 'string') return data.dealId;

  // For deal-related events, the sourceEntityId is the dealId
  if (event.sourceEntityType === 'deal') return event.sourceEntityId;

  return null;
}

export const crmTimelineConsumer: EventConsumer = {
  consumerId: 'crm.timeline-handler',
  moduleId: 'crm',
  subscribesTo: [
    SALES_EVENTS.DEAL_CREATED,
    SALES_EVENTS.DEAL_WON,
    SALES_EVENTS.DEAL_LOST,
    SALES_EVENTS.CONTACT_CREATED,
    SALES_EVENTS.STAGE_CHANGED,
    SALES_EVENTS.ORDER_CONFIRMED,
    SALES_EVENTS.ORDER_CANCELLED,
  ],

  async handle(event: DomainEvent): Promise<void> {
    const dealId = extractDealId(event);

    if (!dealId) {
      getLogger().warn(
        { eventId: event.id, type: event.type },
        '[CrmConsumer] Evento sem dealId - timeline nao criada',
      );
      return;
    }

    const title = buildTimelineTitle(event);
    const timelineType = mapToTimelineType(event.type);

    getLogger().info(
      { eventId: event.id, type: event.type, dealId, title },
      `[CrmConsumer] Criando timeline: ${title}`,
    );

    try {
      const timelineRepo = getTimelineEventsRepository();
      const { UniqueEntityID } = await import('@/entities/domain/unique-entity-id');
      const { TimelineEvent } = await import('@/entities/sales/timeline-event');

      const timelineEvent = TimelineEvent.create({
        tenantId: new UniqueEntityID(event.tenantId),
        dealId: new UniqueEntityID(dealId),
        type: timelineType,
        title,
        metadata: {
          sourceEventId: event.id,
          sourceEventType: event.type,
          ...(event.data as Record<string, unknown>),
        },
        userId: event.metadata?.userId
          ? new UniqueEntityID(event.metadata.userId)
          : undefined,
      });

      await timelineRepo.create(timelineEvent);

      getLogger().info(
        { eventId: event.id, dealId, timelineEventId: timelineEvent.id.toString() },
        `[CrmConsumer] Timeline criada para deal ${dealId}`,
      );
    } catch (err) {
      getLogger().error(
        { eventId: event.id, dealId, error: err },
        '[CrmConsumer] Falha ao criar timeline event',
      );
      throw err; // Re-throw to trigger retry
    }
  },
};
