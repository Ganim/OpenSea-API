import { randomUUID } from 'node:crypto';

import { beforeEach, describe, expect, it } from 'vitest';

import type { DomainEvent } from '../domain-event.interface';
import { FINANCE_EVENTS } from '../finance-events';
import { SALES_EVENTS } from '../sales-events';
import { TypedEventBus } from '../typed-event-bus';
import {
  financeOrderPaymentConsumer,
  financePixPaymentConsumer,
} from './finance-consumer';

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
    sourceEntityType: 'order',
    sourceEntityId: randomUUID(),
    data: {},
    timestamp: new Date().toISOString(),
    metadata: { userId: 'user-1' },
    ...overrides,
  };
}

describe('Finance Consumer', () => {
  let bus: TestEventBus;

  beforeEach(() => {
    bus = new TestEventBus({ defaultMaxRetries: 0 });
  });

  describe('Consumer Registration', () => {
    it('should register finance order payment consumer', () => {
      bus.register(financeOrderPaymentConsumer);

      const consumers = bus.getConsumersForEvent(SALES_EVENTS.ORDER_PAID);
      expect(consumers).toHaveLength(1);
      expect(consumers[0].consumerId).toBe('finance.order-payment-handler');
    });

    it('should register finance pix payment consumer', () => {
      bus.register(financePixPaymentConsumer);

      const consumers = bus.getConsumersForEvent(
        FINANCE_EVENTS.PIX_PAYMENT_RECEIVED,
      );
      expect(consumers).toHaveLength(1);
      expect(consumers[0].consumerId).toBe('finance.pix-payment-handler');
    });

    it('should not match finance consumers to unrelated events', () => {
      bus.register(financeOrderPaymentConsumer);
      bus.register(financePixPaymentConsumer);

      const orderConfirmedConsumers = bus.getConsumersForEvent(
        SALES_EVENTS.ORDER_CONFIRMED,
      );
      expect(orderConfirmedConsumers).toHaveLength(0);

      const dealWonConsumers = bus.getConsumersForEvent(SALES_EVENTS.DEAL_WON);
      expect(dealWonConsumers).toHaveLength(0);
    });
  });

  describe('Consumer Properties', () => {
    it('finance consumers should belong to finance module', () => {
      expect(financeOrderPaymentConsumer.moduleId).toBe('finance');
      expect(financePixPaymentConsumer.moduleId).toBe('finance');
    });

    it('finance consumers should have unique IDs', () => {
      const ids = [
        financeOrderPaymentConsumer.consumerId,
        financePixPaymentConsumer.consumerId,
      ];
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('order payment consumer should subscribe to ORDER_PAID', () => {
      expect(financeOrderPaymentConsumer.subscribesTo).toContain(
        SALES_EVENTS.ORDER_PAID,
      );
    });

    it('pix payment consumer should subscribe to PIX_PAYMENT_RECEIVED', () => {
      expect(financePixPaymentConsumer.subscribesTo).toContain(
        FINANCE_EVENTS.PIX_PAYMENT_RECEIVED,
      );
    });
  });

  describe('financeOrderPaymentConsumer - handle', () => {
    it('should have the correct consumer interface shape', () => {
      expect(financeOrderPaymentConsumer).toHaveProperty('consumerId');
      expect(financeOrderPaymentConsumer).toHaveProperty('moduleId');
      expect(financeOrderPaymentConsumer).toHaveProperty('subscribesTo');
      expect(financeOrderPaymentConsumer).toHaveProperty('handle');
      expect(typeof financeOrderPaymentConsumer.handle).toBe('function');
    });

    it('should subscribe to exactly one event type', () => {
      expect(financeOrderPaymentConsumer.subscribesTo).toHaveLength(1);
    });
  });

  describe('financePixPaymentConsumer - handle', () => {
    it('should have the correct consumer interface shape', () => {
      expect(financePixPaymentConsumer).toHaveProperty('consumerId');
      expect(financePixPaymentConsumer).toHaveProperty('moduleId');
      expect(financePixPaymentConsumer).toHaveProperty('subscribesTo');
      expect(financePixPaymentConsumer).toHaveProperty('handle');
      expect(typeof financePixPaymentConsumer.handle).toBe('function');
    });

    it('should subscribe to exactly one event type', () => {
      expect(financePixPaymentConsumer.subscribesTo).toHaveLength(1);
    });
  });

  describe('Multi-Consumer Dispatch', () => {
    it('should dispatch ORDER_PAID only to finance order payment consumer', () => {
      bus.register(financeOrderPaymentConsumer);
      bus.register(financePixPaymentConsumer);

      const consumers = bus.getConsumersForEvent(SALES_EVENTS.ORDER_PAID);
      expect(consumers).toHaveLength(1);
      expect(consumers[0].consumerId).toBe('finance.order-payment-handler');
    });

    it('should dispatch PIX_PAYMENT_RECEIVED only to finance pix consumer', () => {
      bus.register(financeOrderPaymentConsumer);
      bus.register(financePixPaymentConsumer);

      const consumers = bus.getConsumersForEvent(
        FINANCE_EVENTS.PIX_PAYMENT_RECEIVED,
      );
      expect(consumers).toHaveLength(1);
      expect(consumers[0].consumerId).toBe('finance.pix-payment-handler');
    });
  });
});
