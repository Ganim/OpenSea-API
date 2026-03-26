import { randomUUID } from 'node:crypto';

import { beforeEach, describe, expect, it } from 'vitest';

import type { DomainEvent } from '../domain-event.interface';
import { SALES_EVENTS } from '../sales-events';
import { TypedEventBus } from '../typed-event-bus';
import { dealWonOrderCreationConsumer } from './deal-won-consumer';

/** Test subclass that skips delays */
class TestEventBus extends TypedEventBus {
  protected override delay(_ms: number): Promise<void> {
    return Promise.resolve();
  }
}

function _makeEvent(overrides: Partial<DomainEvent> = {}): DomainEvent {
  return {
    id: randomUUID(),
    type: 'test.entity.created',
    version: 1,
    tenantId: 'tenant-1',
    source: 'sales',
    sourceEntityType: 'deal',
    sourceEntityId: randomUUID(),
    data: {},
    timestamp: new Date().toISOString(),
    metadata: { userId: 'user-1' },
    ...overrides,
  };
}

describe('Deal Won Consumer', () => {
  let bus: TestEventBus;

  beforeEach(() => {
    bus = new TestEventBus({ defaultMaxRetries: 0 });
  });

  describe('Consumer Registration', () => {
    it('should register deal won order creation consumer', () => {
      bus.register(dealWonOrderCreationConsumer);

      const consumers = bus.getConsumersForEvent(SALES_EVENTS.DEAL_WON);
      expect(consumers).toHaveLength(1);
      expect(consumers[0].consumerId).toBe('sales.deal-won-order-handler');
    });

    it('should not match deal won consumer to unrelated events', () => {
      bus.register(dealWonOrderCreationConsumer);

      const orderConfirmedConsumers = bus.getConsumersForEvent(
        SALES_EVENTS.ORDER_CONFIRMED,
      );
      expect(orderConfirmedConsumers).toHaveLength(0);

      const dealCreatedConsumers = bus.getConsumersForEvent(
        SALES_EVENTS.DEAL_CREATED,
      );
      expect(dealCreatedConsumers).toHaveLength(0);

      const dealLostConsumers = bus.getConsumersForEvent(
        SALES_EVENTS.DEAL_LOST,
      );
      expect(dealLostConsumers).toHaveLength(0);
    });
  });

  describe('Consumer Properties', () => {
    it('should belong to sales module', () => {
      expect(dealWonOrderCreationConsumer.moduleId).toBe('sales');
    });

    it('should have a unique consumer ID', () => {
      expect(dealWonOrderCreationConsumer.consumerId).toBe(
        'sales.deal-won-order-handler',
      );
    });

    it('should subscribe only to DEAL_WON', () => {
      expect(dealWonOrderCreationConsumer.subscribesTo).toHaveLength(1);
      expect(dealWonOrderCreationConsumer.subscribesTo).toContain(
        SALES_EVENTS.DEAL_WON,
      );
    });

    it('should have the correct consumer interface shape', () => {
      expect(dealWonOrderCreationConsumer).toHaveProperty('consumerId');
      expect(dealWonOrderCreationConsumer).toHaveProperty('moduleId');
      expect(dealWonOrderCreationConsumer).toHaveProperty('subscribesTo');
      expect(dealWonOrderCreationConsumer).toHaveProperty('handle');
      expect(typeof dealWonOrderCreationConsumer.handle).toBe('function');
    });
  });

  describe('Multi-Consumer Dispatch with Existing Consumers', () => {
    it('should coexist with CRM consumer on DEAL_WON events', async () => {
      const { crmTimelineConsumer } = await import('./crm-consumer');
      const { notificationConsumer } = await import('./notification-consumer');

      bus.register(dealWonOrderCreationConsumer);
      bus.register(crmTimelineConsumer);
      bus.register(notificationConsumer);

      const consumers = bus.getConsumersForEvent(SALES_EVENTS.DEAL_WON);
      // deal-won-order-handler + crm.timeline-handler + notifications.alert-handler
      expect(consumers).toHaveLength(3);

      const consumerIds = consumers.map((c) => c.consumerId).sort();
      expect(consumerIds).toEqual([
        'crm.timeline-handler',
        'notifications.alert-handler',
        'sales.deal-won-order-handler',
      ]);
    });
  });
});
