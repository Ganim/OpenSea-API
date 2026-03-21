/**
 * CRM module event consumer — placeholder.
 *
 * Creates timeline events on Contact/Customer/Deal when cross-module
 * events occur (e.g., order confirmed, payment received).
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
    getLogger().info(
      {
        eventId: event.id,
        type: event.type,
        sourceEntityType: event.sourceEntityType,
        sourceEntityId: event.sourceEntityId,
      },
      '[CrmConsumer] Placeholder: create timeline event from cross-module event',
    );

    // TODO: Implement actual CRM timeline event creation
    // await createTimelineEvent({
    //   source: event.source,
    //   type: event.type,
    //   entityId: event.sourceEntityId,
    //   customerId: event.data.customerId,
    //   data: event.data,
    //   title: buildTimelineTitle(event),
    //   timestamp: event.timestamp,
    // })
  },
};
