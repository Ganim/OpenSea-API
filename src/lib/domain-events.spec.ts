import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  calculateBackoffDelay,
  domainEventBus,
  type DomainEvent,
  type EnhancedDomainEvent,
} from './domain-events';

describe('DomainEventBus', () => {
  beforeEach(() => {
    domainEventBus.clear();
    domainEventBus.disablePersistence();
  });

  // ─── Legacy on()/emit() API ──────────────────────────────────────────────

  describe('Legacy on()/emit() API', () => {
    it('should call registered handler when event is emitted', async () => {
      const handler = vi.fn();
      domainEventBus.on('test.event', handler);

      const event: DomainEvent = {
        type: 'test.event',
        tenantId: 'tenant-1',
        userId: 'user-1',
        payload: { foo: 'bar' },
        occurredAt: new Date(),
      };

      await domainEventBus.emit(event);

      expect(handler).toHaveBeenCalledWith(event);
    });

    it('should call multiple handlers for the same event', async () => {
      const handlerA = vi.fn();
      const handlerB = vi.fn();
      domainEventBus.on('test.event', handlerA);
      domainEventBus.on('test.event', handlerB);

      await domainEventBus.emit({
        type: 'test.event',
        tenantId: 't',
        userId: 'u',
        payload: {},
        occurredAt: new Date(),
      });

      expect(handlerA).toHaveBeenCalledOnce();
      expect(handlerB).toHaveBeenCalledOnce();
    });

    it('should not call handlers for different event types', async () => {
      const handler = vi.fn();
      domainEventBus.on('other.event', handler);

      await domainEventBus.emit({
        type: 'test.event',
        tenantId: 't',
        userId: 'u',
        payload: {},
        occurredAt: new Date(),
      });

      expect(handler).not.toHaveBeenCalled();
    });

    it('should not throw when a handler fails', async () => {
      const failingHandler = vi
        .fn()
        .mockRejectedValue(new Error('handler failed'));
      const successHandler = vi.fn();

      domainEventBus.on('test.event', failingHandler);
      domainEventBus.on('test.event', successHandler);

      await expect(
        domainEventBus.emit({
          type: 'test.event',
          tenantId: 't',
          userId: 'u',
          payload: {},
          occurredAt: new Date(),
        }),
      ).resolves.toBeUndefined();

      expect(failingHandler).toHaveBeenCalled();
      expect(successHandler).toHaveBeenCalled();
    });

    it('should clear all handlers', () => {
      domainEventBus.on('test.event', vi.fn());
      domainEventBus.on('test.event', vi.fn());

      expect(domainEventBus.handlerCount('test.event')).toBe(2);

      domainEventBus.clear();

      expect(domainEventBus.handlerCount('test.event')).toBe(0);
    });

    it('should handle events with no registered handlers gracefully', async () => {
      await expect(
        domainEventBus.emit({
          type: 'unregistered.event',
          tenantId: 't',
          userId: 'u',
          payload: {},
          occurredAt: new Date(),
        }),
      ).resolves.toBeUndefined();
    });
  });

  // ─── Consumer Registration ──────────────────────────────────────────────

  describe('register() — Named Consumers', () => {
    it('should call a registered consumer when its event is emitted', async () => {
      const handleFn = vi.fn();

      domainEventBus.register({
        name: 'test-consumer',
        eventTypes: ['test.event'],
        handle: handleFn,
      });

      const event: DomainEvent = {
        type: 'test.event',
        tenantId: 'tenant-1',
        userId: 'user-1',
        payload: { key: 'value' },
        occurredAt: new Date(),
      };

      await domainEventBus.emit(event);

      expect(handleFn).toHaveBeenCalledWith(event);
    });

    it('should register a consumer for multiple event types', async () => {
      const handleFn = vi.fn();

      domainEventBus.register({
        name: 'multi-event-consumer',
        eventTypes: ['event.a', 'event.b'],
        handle: handleFn,
      });

      await domainEventBus.emit({
        type: 'event.a',
        tenantId: 't',
        userId: 'u',
        payload: {},
        occurredAt: new Date(),
      });

      await domainEventBus.emit({
        type: 'event.b',
        tenantId: 't',
        userId: 'u',
        payload: {},
        occurredAt: new Date(),
      });

      expect(handleFn).toHaveBeenCalledTimes(2);
    });

    it('should track consumer names', () => {
      domainEventBus.register({
        name: 'calendar-sync',
        eventTypes: ['hr.absence.approved'],
        handle: vi.fn(),
      });

      domainEventBus.register({
        name: 'notification-sender',
        eventTypes: ['hr.absence.approved'],
        handle: vi.fn(),
      });

      const consumerNames = domainEventBus.consumerNames('hr.absence.approved');
      expect(consumerNames).toEqual(['calendar-sync', 'notification-sender']);
    });

    it('should count both legacy handlers and consumers in handlerCount', () => {
      domainEventBus.on('test.event', vi.fn());

      domainEventBus.register({
        name: 'named-consumer',
        eventTypes: ['test.event'],
        handle: vi.fn(),
      });

      expect(domainEventBus.handlerCount('test.event')).toBe(2);
    });

    it('should track total unique consumers across all event types', () => {
      domainEventBus.register({
        name: 'consumer-a',
        eventTypes: ['event.1', 'event.2'],
        handle: vi.fn(),
      });

      domainEventBus.register({
        name: 'consumer-b',
        eventTypes: ['event.1'],
        handle: vi.fn(),
      });

      expect(domainEventBus.totalConsumerCount).toBe(2);
    });

    it('should clear consumers when clear() is called', () => {
      domainEventBus.register({
        name: 'consumer',
        eventTypes: ['test.event'],
        handle: vi.fn(),
      });

      domainEventBus.clear();

      expect(domainEventBus.consumerNames('test.event')).toEqual([]);
      expect(domainEventBus.totalConsumerCount).toBe(0);
    });
  });

  // ─── Retry with Exponential Backoff ─────────────────────────────────────

  describe('Retry with Exponential Backoff', () => {
    it('should retry a failing consumer up to maxRetries', async () => {
      let callCount = 0;
      const handleFn = vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount < 3) {
          throw new Error(`Attempt ${callCount} failed`);
        }
      });

      domainEventBus.register({
        name: 'flaky-consumer',
        eventTypes: ['test.event'],
        handle: handleFn,
        maxRetries: 3,
      });

      await domainEventBus.emit({
        type: 'test.event',
        tenantId: 't',
        userId: 'u',
        payload: {},
        occurredAt: new Date(),
      });

      // Called 3 times: 2 failures + 1 success
      expect(handleFn).toHaveBeenCalledTimes(3);
    }, 30_000);

    it('should not retry beyond maxRetries', async () => {
      const handleFn = vi.fn().mockRejectedValue(new Error('always fails'));

      domainEventBus.register({
        name: 'always-failing-consumer',
        eventTypes: ['test.event'],
        handle: handleFn,
        maxRetries: 2,
      });

      await domainEventBus.emit({
        type: 'test.event',
        tenantId: 't',
        userId: 'u',
        payload: {},
        occurredAt: new Date(),
      });

      // Initial attempt + 2 retries = 3 calls
      expect(handleFn).toHaveBeenCalledTimes(3);
    }, 30_000);

    it('should not propagate consumer failure to the caller', async () => {
      domainEventBus.register({
        name: 'failing-consumer',
        eventTypes: ['test.event'],
        handle: vi.fn().mockRejectedValue(new Error('fail')),
        maxRetries: 0,
      });

      await expect(
        domainEventBus.emit({
          type: 'test.event',
          tenantId: 't',
          userId: 'u',
          payload: {},
          occurredAt: new Date(),
        }),
      ).resolves.toBeUndefined();
    });

    it('should use default maxRetries of 3 when not specified', async () => {
      const handleFn = vi.fn().mockRejectedValue(new Error('fail'));

      domainEventBus.register({
        name: 'default-retry-consumer',
        eventTypes: ['test.event'],
        handle: handleFn,
        // No maxRetries specified — default is 3
      });

      await domainEventBus.emit({
        type: 'test.event',
        tenantId: 't',
        userId: 'u',
        payload: {},
        occurredAt: new Date(),
      });

      // Initial attempt + 3 retries = 4 calls
      expect(handleFn).toHaveBeenCalledTimes(4);
    }, 60_000);
  });

  // ─── calculateBackoffDelay ──────────────────────────────────────────────

  describe('calculateBackoffDelay', () => {
    it('should increase delay exponentially', () => {
      const config = { maxRetries: 5, baseDelayMs: 100, maxDelayMs: 10_000 };

      const delay0 = calculateBackoffDelay(0, config);
      const delay1 = calculateBackoffDelay(1, config);
      const delay2 = calculateBackoffDelay(2, config);

      // delay0 = 100 * 2^0 + jitter = ~100-150
      expect(delay0).toBeGreaterThanOrEqual(100);
      expect(delay0).toBeLessThanOrEqual(200);

      // delay1 = 100 * 2^1 + jitter = ~200-250
      expect(delay1).toBeGreaterThanOrEqual(200);
      expect(delay1).toBeLessThanOrEqual(300);

      // delay2 = 100 * 2^2 + jitter = ~400-450
      expect(delay2).toBeGreaterThanOrEqual(400);
      expect(delay2).toBeLessThanOrEqual(500);
    });

    it('should cap delay at maxDelayMs', () => {
      const config = { maxRetries: 10, baseDelayMs: 1000, maxDelayMs: 5000 };

      // 1000 * 2^10 = 1024000 — way above max
      const delayAttempt10 = calculateBackoffDelay(10, config);
      expect(delayAttempt10).toBeLessThanOrEqual(5000);
    });
  });

  // ─── EventLog Persistence ──────────────────────────────────────────────

  describe('EventLog Persistence', () => {
    it('should persist event when persistence is enabled', async () => {
      const mockCreate = vi.fn().mockResolvedValue({});
      const mockUpdate = vi.fn().mockResolvedValue({});
      const mockPrisma = {
        eventLog: { create: mockCreate, update: mockUpdate },
      };

      domainEventBus.enablePersistence(mockPrisma);

      const enhancedEvent: EnhancedDomainEvent<{ orderId: string }> = {
        type: 'sales.order.created',
        tenantId: 'tenant-1',
        userId: 'user-1',
        payload: { orderId: 'order-123' },
        occurredAt: new Date(),
        source: 'sales',
        sourceEntityType: 'Order',
        sourceEntityId: 'order-123',
        correlationId: 'corr-abc',
      };

      await domainEventBus.emit(enhancedEvent);

      expect(mockCreate).toHaveBeenCalledOnce();
      const createArgs = mockCreate.mock.calls[0][0];
      expect(createArgs.data.tenantId).toBe('tenant-1');
      expect(createArgs.data.type).toBe('sales.order.created');
      expect(createArgs.data.source).toBe('sales');
      expect(createArgs.data.sourceEntityType).toBe('Order');
      expect(createArgs.data.sourceEntityId).toBe('order-123');
      expect(createArgs.data.correlationId).toBe('corr-abc');
      expect(createArgs.data.status).toBe('PUBLISHED');
    });

    it('should not persist when persistence is disabled', async () => {
      const mockCreate = vi.fn();
      const mockPrisma = {
        eventLog: { create: mockCreate, update: vi.fn() },
      };

      domainEventBus.enablePersistence(mockPrisma);
      domainEventBus.disablePersistence();

      await domainEventBus.emit({
        type: 'test.event',
        tenantId: 't',
        userId: 'u',
        payload: {},
        occurredAt: new Date(),
      });

      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('should update EventLog to PROCESSED when all consumers succeed', async () => {
      const mockCreate = vi.fn().mockResolvedValue({});
      const mockUpdate = vi.fn().mockResolvedValue({});
      const mockPrisma = {
        eventLog: { create: mockCreate, update: mockUpdate },
      };

      domainEventBus.enablePersistence(mockPrisma);

      domainEventBus.register({
        name: 'consumer-success',
        eventTypes: ['test.event'],
        handle: vi.fn().mockResolvedValue(undefined),
      });

      await domainEventBus.emit({
        type: 'test.event',
        tenantId: 't',
        userId: 'u',
        payload: {},
        occurredAt: new Date(),
      });

      expect(mockUpdate).toHaveBeenCalledOnce();
      const updateArgs = mockUpdate.mock.calls[0][0];
      expect(updateArgs.data.status).toBe('PROCESSED');
      expect(updateArgs.data.processedBy).toEqual(['consumer-success']);
    });

    it('should update EventLog to FAILED when a consumer exhausts retries', async () => {
      const mockCreate = vi.fn().mockResolvedValue({});
      const mockUpdate = vi.fn().mockResolvedValue({});
      const mockPrisma = {
        eventLog: { create: mockCreate, update: mockUpdate },
      };

      domainEventBus.enablePersistence(mockPrisma);

      domainEventBus.register({
        name: 'failing-consumer',
        eventTypes: ['test.event'],
        handle: vi.fn().mockRejectedValue(new Error('permanent failure')),
        maxRetries: 0,
      });

      await domainEventBus.emit({
        type: 'test.event',
        tenantId: 't',
        userId: 'u',
        payload: {},
        occurredAt: new Date(),
      });

      expect(mockUpdate).toHaveBeenCalledOnce();
      const updateArgs = mockUpdate.mock.calls[0][0];
      expect(updateArgs.data.status).toBe('FAILED');
      expect(updateArgs.data.failedConsumers).toHaveProperty(
        'failing-consumer',
      );
    });

    it('should not fail emit when persistence create throws', async () => {
      const mockCreate = vi.fn().mockRejectedValue(new Error('DB down'));
      const mockPrisma = {
        eventLog: { create: mockCreate, update: vi.fn() },
      };

      domainEventBus.enablePersistence(mockPrisma);

      const handler = vi.fn();
      domainEventBus.on('test.event', handler);

      await expect(
        domainEventBus.emit({
          type: 'test.event',
          tenantId: 't',
          userId: 'u',
          payload: {},
          occurredAt: new Date(),
        }),
      ).resolves.toBeUndefined();

      // Handler should still be called even if persistence failed
      expect(handler).toHaveBeenCalledOnce();
    });

    it('should use default values for optional EnhancedDomainEvent fields', async () => {
      const mockCreate = vi.fn().mockResolvedValue({});
      const mockPrisma = {
        eventLog: { create: mockCreate, update: vi.fn() },
      };

      domainEventBus.enablePersistence(mockPrisma);

      // Emit a plain DomainEvent (no enhanced fields)
      await domainEventBus.emit({
        type: 'test.event',
        tenantId: 't',
        userId: 'u',
        payload: { simple: true },
        occurredAt: new Date(),
      });

      const createArgs = mockCreate.mock.calls[0][0];
      expect(createArgs.data.source).toBe('unknown');
      expect(createArgs.data.sourceEntityType).toBe('unknown');
      expect(createArgs.data.sourceEntityId).toBe('unknown');
      expect(createArgs.data.version).toBe(1);
    });
  });

  // ─── Enhanced Events ───────────────────────────────────────────────────

  describe('EnhancedDomainEvent', () => {
    it('should be backward compatible with DomainEvent', async () => {
      const handler = vi.fn();
      domainEventBus.on('test.enhanced', handler);

      const enhancedEvent: EnhancedDomainEvent<{ data: string }> = {
        type: 'test.enhanced',
        tenantId: 'tenant-1',
        userId: 'user-1',
        payload: { data: 'hello' },
        occurredAt: new Date(),
        source: 'test-module',
        sourceEntityType: 'TestEntity',
        sourceEntityId: 'entity-123',
        correlationId: 'corr-1',
        causationId: 'cause-1',
        version: 2,
      };

      await domainEventBus.emit(enhancedEvent);

      // Handler receives the full event (including enhanced fields)
      expect(handler).toHaveBeenCalledWith(enhancedEvent);
    });
  });

  // ─── Mixed Legacy + Consumer ────────────────────────────────────────────

  describe('Mixed legacy handlers and named consumers', () => {
    it('should execute both legacy handlers and named consumers for the same event', async () => {
      const legacyHandler = vi.fn();
      const consumerHandler = vi.fn();

      domainEventBus.on('mixed.event', legacyHandler);

      domainEventBus.register({
        name: 'named-consumer',
        eventTypes: ['mixed.event'],
        handle: consumerHandler,
      });

      await domainEventBus.emit({
        type: 'mixed.event',
        tenantId: 't',
        userId: 'u',
        payload: {},
        occurredAt: new Date(),
      });

      expect(legacyHandler).toHaveBeenCalledOnce();
      expect(consumerHandler).toHaveBeenCalledOnce();
    });

    it('should not fail entire emit when one consumer fails but others succeed', async () => {
      const successConsumer = vi.fn();
      const failingConsumer = vi.fn().mockRejectedValue(new Error('fail'));

      domainEventBus.register({
        name: 'success-consumer',
        eventTypes: ['test.event'],
        handle: successConsumer,
        maxRetries: 0,
      });

      domainEventBus.register({
        name: 'failing-consumer',
        eventTypes: ['test.event'],
        handle: failingConsumer,
        maxRetries: 0,
      });

      await expect(
        domainEventBus.emit({
          type: 'test.event',
          tenantId: 't',
          userId: 'u',
          payload: {},
          occurredAt: new Date(),
        }),
      ).resolves.toBeUndefined();

      expect(successConsumer).toHaveBeenCalledOnce();
      expect(failingConsumer).toHaveBeenCalledOnce();
    });
  });
});
