import { randomUUID } from 'node:crypto';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { DomainEvent } from '../domain-event.interface';
import { SALES_EVENTS } from '../sales-events';
import { TypedEventBus } from '../typed-event-bus';
import { stockOrderReservationConsumer, stockOrderCancellationConsumer } from './stock-consumer';
import { crmTimelineConsumer } from './crm-consumer';
import { notificationConsumer } from './notification-consumer';

/** Test subclass that skips delays */
class TestEventBus extends TypedEventBus {
  protected override delay(_ms: number): Promise<void> {
    return Promise.resolve();
  }
}

function makeEvent(overrides: Partial<DomainEvent> = {}): DomainEvent {
  return {
    id: randomUUID(),
    type: 'test.entity.created',
    version: 1,
    tenantId: 'tenant-1',
    source: 'sales',
    sourceEntityType: 'order',
    sourceEntityId: randomUUID(),
    data: {},
    timestamp: new Date().toISOString(),
    metadata: { userId: 'user-1' },
    ...overrides,
  };
}

describe('Event Consumers', () => {
  let bus: TestEventBus;

  beforeEach(() => {
    bus = new TestEventBus({ defaultMaxRetries: 0 });
  });

  describe('Consumer Registration', () => {
    it('should register all consumers without errors', () => {
      bus.register(stockOrderReservationConsumer);
      bus.register(stockOrderCancellationConsumer);
      bus.register(crmTimelineConsumer);
      bus.register(notificationConsumer);

      expect(bus.getConsumers()).toHaveLength(4);
    });

    it('should match stock reservation consumer to ORDER_CONFIRMED events', () => {
      bus.register(stockOrderReservationConsumer);

      const consumers = bus.getConsumersForEvent(SALES_EVENTS.ORDER_CONFIRMED);
      expect(consumers).toHaveLength(1);
      expect(consumers[0].consumerId).toBe('stock.order-reservation-handler');
    });

    it('should match stock cancellation consumer to ORDER_CANCELLED events', () => {
      bus.register(stockOrderCancellationConsumer);

      const consumers = bus.getConsumersForEvent(SALES_EVENTS.ORDER_CANCELLED);
      expect(consumers).toHaveLength(1);
      expect(consumers[0].consumerId).toBe('stock.order-cancellation-handler');
    });

    it('should match CRM consumer to all deal and order events', () => {
      bus.register(crmTimelineConsumer);

      const dealCreatedConsumers = bus.getConsumersForEvent(SALES_EVENTS.DEAL_CREATED);
      const dealWonConsumers = bus.getConsumersForEvent(SALES_EVENTS.DEAL_WON);
      const dealLostConsumers = bus.getConsumersForEvent(SALES_EVENTS.DEAL_LOST);
      const orderConfirmedConsumers = bus.getConsumersForEvent(SALES_EVENTS.ORDER_CONFIRMED);
      const orderCancelledConsumers = bus.getConsumersForEvent(SALES_EVENTS.ORDER_CANCELLED);
      const stageChangedConsumers = bus.getConsumersForEvent(SALES_EVENTS.STAGE_CHANGED);

      expect(dealCreatedConsumers).toHaveLength(1);
      expect(dealWonConsumers).toHaveLength(1);
      expect(dealLostConsumers).toHaveLength(1);
      expect(orderConfirmedConsumers).toHaveLength(1);
      expect(orderCancelledConsumers).toHaveLength(1);
      expect(stageChangedConsumers).toHaveLength(1);
    });

    it('should match notification consumer to high-priority events', () => {
      bus.register(notificationConsumer);

      const dealWon = bus.getConsumersForEvent(SALES_EVENTS.DEAL_WON);
      const orderConfirmed = bus.getConsumersForEvent(SALES_EVENTS.ORDER_CONFIRMED);
      const orderCancelled = bus.getConsumersForEvent(SALES_EVENTS.ORDER_CANCELLED);
      const campaignActivated = bus.getConsumersForEvent(SALES_EVENTS.CAMPAIGN_ACTIVATED);

      expect(dealWon).toHaveLength(1);
      expect(orderConfirmed).toHaveLength(1);
      expect(orderCancelled).toHaveLength(1);
      expect(campaignActivated).toHaveLength(1);

      // Should not match deal created (not a high-priority notification)
      const dealCreated = bus.getConsumersForEvent(SALES_EVENTS.DEAL_CREATED);
      expect(dealCreated).toHaveLength(0);
    });
  });

  describe('Multiple Consumer Dispatch', () => {
    it('should dispatch ORDER_CONFIRMED to stock, CRM, and notification consumers', () => {
      bus.register(stockOrderReservationConsumer);
      bus.register(crmTimelineConsumer);
      bus.register(notificationConsumer);

      const consumers = bus.getConsumersForEvent(SALES_EVENTS.ORDER_CONFIRMED);
      expect(consumers).toHaveLength(3);

      const consumerIds = consumers.map((c) => c.consumerId).sort();
      expect(consumerIds).toEqual([
        'crm.timeline-handler',
        'notifications.alert-handler',
        'stock.order-reservation-handler',
      ]);
    });

    it('should dispatch DEAL_WON to CRM and notification consumers', () => {
      bus.register(stockOrderReservationConsumer);
      bus.register(stockOrderCancellationConsumer);
      bus.register(crmTimelineConsumer);
      bus.register(notificationConsumer);

      const consumers = bus.getConsumersForEvent(SALES_EVENTS.DEAL_WON);
      expect(consumers).toHaveLength(2);

      const consumerIds = consumers.map((c) => c.consumerId).sort();
      expect(consumerIds).toEqual([
        'crm.timeline-handler',
        'notifications.alert-handler',
      ]);
    });
  });

  describe('Consumer Properties', () => {
    it('stock consumers should belong to stock module', () => {
      expect(stockOrderReservationConsumer.moduleId).toBe('stock');
      expect(stockOrderCancellationConsumer.moduleId).toBe('stock');
    });

    it('CRM consumer should belong to crm module', () => {
      expect(crmTimelineConsumer.moduleId).toBe('crm');
    });

    it('notification consumer should belong to notifications module', () => {
      expect(notificationConsumer.moduleId).toBe('notifications');
    });

    it('all consumers should have unique IDs', () => {
      const ids = [
        stockOrderReservationConsumer.consumerId,
        stockOrderCancellationConsumer.consumerId,
        crmTimelineConsumer.consumerId,
        notificationConsumer.consumerId,
      ];
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('CRM Consumer - handle', () => {
    it('should skip events without dealId', async () => {
      // Event without dealId in data or sourceEntityType !== 'deal'
      const event = makeEvent({
        type: SALES_EVENTS.ORDER_CONFIRMED,
        sourceEntityType: 'order',
        data: {
          orderId: randomUUID(),
          customerId: randomUUID(),
          items: [],
          total: 100,
        },
      });

      // Should not throw — just log and skip
      await expect(crmTimelineConsumer.handle(event)).resolves.toBeUndefined();
    });
  });

  describe('Notification Consumer - handle', () => {
    it('should skip events without userId', async () => {
      const event = makeEvent({
        type: SALES_EVENTS.DEAL_WON,
        sourceEntityType: 'deal',
        data: {
          dealId: randomUUID(),
          customerId: randomUUID(),
          value: 5000,
        },
        metadata: {}, // No userId
      });

      // Should not throw — just log and skip
      await expect(notificationConsumer.handle(event)).resolves.toBeUndefined();
    });
  });

  describe('Stock Consumer - handle (ORDER_CONFIRMED)', () => {
    it('should skip orders with no items', async () => {
      const event = makeEvent({
        type: SALES_EVENTS.ORDER_CONFIRMED,
        data: {
          orderId: randomUUID(),
          customerId: randomUUID(),
          items: [],
          total: 0,
        },
      });

      // Should not throw — just log and skip
      await expect(
        stockOrderReservationConsumer.handle(event),
      ).resolves.toBeUndefined();
    });
  });
});
