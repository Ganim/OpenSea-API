import { randomUUID } from 'node:crypto';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { DomainEvent, EventConsumer } from './domain-event.interface';
import { TypedEventBus } from './typed-event-bus';

/** Test subclass that skips delays for fast tests */
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
    source: 'test',
    sourceEntityType: 'entity',
    sourceEntityId: randomUUID(),
    data: { foo: 'bar' },
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

function makeConsumer(
  overrides: Partial<EventConsumer> = {},
): EventConsumer & { handle: ReturnType<typeof vi.fn> } {
  return {
    consumerId: `test.consumer-${randomUUID().slice(0, 8)}`,
    moduleId: 'test',
    subscribesTo: ['test.entity.created'],
    handle: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('TypedEventBus', () => {
  let bus: TestEventBus;

  beforeEach(() => {
    bus = new TestEventBus();
  });

  // ─── Consumer Registration ──────────────────────────────────────────────

  it('should register and retrieve consumers', () => {
    const consumer = makeConsumer();
    bus.register(consumer);

    expect(bus.getConsumers()).toHaveLength(1);
    expect(bus.getConsumers()[0].consumerId).toBe(consumer.consumerId);
  });

  it('should unregister a consumer by ID', () => {
    const consumer = makeConsumer();
    bus.register(consumer);
    bus.unregister(consumer.consumerId);

    expect(bus.getConsumers()).toHaveLength(0);
  });

  it('should clear all consumers', () => {
    bus.register(makeConsumer());
    bus.register(makeConsumer());
    bus.clear();

    expect(bus.getConsumers()).toHaveLength(0);
  });

  it('should return consumers matching an event type', () => {
    const matchingConsumer = makeConsumer({
      subscribesTo: ['sales.order.confirmed'],
    });
    const nonMatchingConsumer = makeConsumer({
      subscribesTo: ['stock.item.reserved'],
    });

    bus.register(matchingConsumer);
    bus.register(nonMatchingConsumer);

    const result = bus.getConsumersForEvent('sales.order.confirmed');
    expect(result).toHaveLength(1);
    expect(result[0].consumerId).toBe(matchingConsumer.consumerId);
  });

  // ─── Publishing & Dispatching ───────────────────────────────────────────

  it('should dispatch event to matching consumer', async () => {
    const consumer = makeConsumer();
    bus.register(consumer);

    const event = makeEvent();
    await bus.publish(event);

    expect(consumer.handle).toHaveBeenCalledOnce();
    expect(consumer.handle).toHaveBeenCalledWith(
      expect.objectContaining({
        type: event.type,
        tenantId: event.tenantId,
        data: event.data,
      }),
    );
  });

  it('should NOT dispatch event to non-matching consumers', async () => {
    const consumer = makeConsumer({
      subscribesTo: ['other.event.type'],
    });
    bus.register(consumer);

    await bus.publish(makeEvent());

    expect(consumer.handle).not.toHaveBeenCalled();
  });

  it('should dispatch to multiple matching consumers', async () => {
    const consumer1 = makeConsumer();
    const consumer2 = makeConsumer();
    bus.register(consumer1);
    bus.register(consumer2);

    await bus.publish(makeEvent());

    expect(consumer1.handle).toHaveBeenCalledOnce();
    expect(consumer2.handle).toHaveBeenCalledOnce();
  });

  it('should auto-assign id and timestamp if not provided', async () => {
    const consumer = makeConsumer();
    bus.register(consumer);

    const published = await bus.publish({
      type: 'test.entity.created',
      version: 1,
      tenantId: 'tenant-1',
      source: 'test',
      sourceEntityType: 'entity',
      sourceEntityId: 'entity-1',
      data: {},
    });

    expect(published.id).toBeDefined();
    expect(published.timestamp).toBeDefined();
  });

  // ─── Retry on Failure ───────────────────────────────────────────────────

  it('should retry a failing consumer up to maxRetries', async () => {
    const consumer = makeConsumer({
      retryStrategy: { maxRetries: 2, backoffMs: 10, deadLetterAfter: 2 },
    });
    // Fail twice, then succeed on 3rd attempt (attempt 0 + 2 retries)
    consumer.handle
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValueOnce(undefined);

    bus.register(consumer);
    await bus.publish(makeEvent());

    // 3 calls total: initial + 2 retries
    expect(consumer.handle).toHaveBeenCalledTimes(3);
  });

  it('should stop retrying after maxRetries exhausted', async () => {
    const consumer = makeConsumer({
      retryStrategy: { maxRetries: 1, backoffMs: 10, deadLetterAfter: 1 },
    });
    consumer.handle.mockRejectedValue(new Error('persistent failure'));

    bus.register(consumer);
    await bus.publish(makeEvent());

    // 2 calls: initial + 1 retry
    expect(consumer.handle).toHaveBeenCalledTimes(2);
  });

  // ─── Dead Letter after Max Retries ──────────────────────────────────────

  it('should mark event as DEAD_LETTER in EventLog when all consumers fail', async () => {
    const mockRepo = {
      create: vi.fn().mockResolvedValue({}),
      findById: vi.fn(),
      findMany: vi.fn(),
      updateStatus: vi.fn().mockResolvedValue({}),
      findDeadLetters: vi.fn(),
      replay: vi.fn(),
    };

    const busWithRepo = new TestEventBus({
      eventLogRepository: mockRepo,
      defaultMaxRetries: 0, // Fail immediately — no retries
    });

    const consumer = makeConsumer();
    consumer.handle.mockRejectedValue(new Error('total failure'));
    busWithRepo.register(consumer);

    await busWithRepo.publish(makeEvent());

    expect(mockRepo.create).toHaveBeenCalledOnce();
    expect(mockRepo.updateStatus).toHaveBeenCalledWith(
      expect.any(String),
      'DEAD_LETTER',
      expect.objectContaining({
        processedBy: [],
        failedConsumers: expect.objectContaining({
          [consumer.consumerId]: 'total failure',
        }),
      }),
    );
  });

  it('should mark event as PROCESSED when all consumers succeed', async () => {
    const mockRepo = {
      create: vi.fn().mockResolvedValue({}),
      findById: vi.fn(),
      findMany: vi.fn(),
      updateStatus: vi.fn().mockResolvedValue({}),
      findDeadLetters: vi.fn(),
      replay: vi.fn(),
    };

    const busWithRepo = new TestEventBus({
      eventLogRepository: mockRepo,
    });

    const consumer = makeConsumer();
    busWithRepo.register(consumer);

    await busWithRepo.publish(makeEvent());

    expect(mockRepo.updateStatus).toHaveBeenCalledWith(
      expect.any(String),
      'PROCESSED',
      expect.objectContaining({
        processedBy: [consumer.consumerId],
        processedAt: expect.any(Date),
      }),
    );
  });

  it('should mark event as FAILED when some consumers succeed and some fail', async () => {
    const mockRepo = {
      create: vi.fn().mockResolvedValue({}),
      findById: vi.fn(),
      findMany: vi.fn(),
      updateStatus: vi.fn().mockResolvedValue({}),
      findDeadLetters: vi.fn(),
      replay: vi.fn(),
    };

    const busWithRepo = new TestEventBus({
      eventLogRepository: mockRepo,
      defaultMaxRetries: 0,
    });

    const successConsumer = makeConsumer();
    const failConsumer = makeConsumer();
    failConsumer.handle.mockRejectedValue(new Error('partial failure'));

    busWithRepo.register(successConsumer);
    busWithRepo.register(failConsumer);

    await busWithRepo.publish(makeEvent());

    expect(mockRepo.updateStatus).toHaveBeenCalledWith(
      expect.any(String),
      'FAILED',
      expect.objectContaining({
        processedBy: [successConsumer.consumerId],
        failedConsumers: expect.objectContaining({
          [failConsumer.consumerId]: 'partial failure',
        }),
      }),
    );
  });

  // ─── Idempotency Support ───────────────────────────────────────────────

  it('should allow publishing the same event ID without error', async () => {
    const eventId = randomUUID();
    const consumer = makeConsumer();
    bus.register(consumer);

    await bus.publish(makeEvent({ id: eventId }));
    await bus.publish(makeEvent({ id: eventId }));

    // Consumer is called both times — idempotency is the consumer's responsibility
    expect(consumer.handle).toHaveBeenCalledTimes(2);
  });

  // ─── EventLog Persistence ──────────────────────────────────────────────

  it('should persist event to EventLog repository', async () => {
    const mockRepo = {
      create: vi.fn().mockResolvedValue({}),
      findById: vi.fn(),
      findMany: vi.fn(),
      updateStatus: vi.fn().mockResolvedValue({}),
      findDeadLetters: vi.fn(),
      replay: vi.fn(),
    };

    const busWithRepo = new TestEventBus({
      eventLogRepository: mockRepo,
    });

    const event = makeEvent();
    await busWithRepo.publish(event);

    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        id: event.id,
        tenantId: event.tenantId,
        type: event.type,
        version: event.version,
        source: event.source,
        sourceEntityType: event.sourceEntityType,
        sourceEntityId: event.sourceEntityId,
        data: event.data,
      }),
    );
  });

  it('should continue dispatching even if EventLog persistence fails', async () => {
    const mockRepo = {
      create: vi.fn().mockRejectedValue(new Error('DB down')),
      findById: vi.fn(),
      findMany: vi.fn(),
      updateStatus: vi.fn().mockResolvedValue({}),
      findDeadLetters: vi.fn(),
      replay: vi.fn(),
    };

    const busWithRepo = new TestEventBus({
      eventLogRepository: mockRepo,
    });

    const consumer = makeConsumer();
    busWithRepo.register(consumer);

    await busWithRepo.publish(makeEvent());

    // Consumer still receives the event despite persistence failure
    expect(consumer.handle).toHaveBeenCalledOnce();
  });

  // ─── Edge Cases ────────────────────────────────────────────────────────

  it('should handle publishing with no matching consumers gracefully', async () => {
    const result = await bus.publish(makeEvent({ type: 'nobody.listens' }));
    expect(result.type).toBe('nobody.listens');
  });

  it('should isolate consumer failures (one failing does not block others)', async () => {
    const failConsumer = makeConsumer();
    failConsumer.handle.mockRejectedValue(new Error('fail'));

    const successConsumer = makeConsumer();

    bus = new TestEventBus({ defaultMaxRetries: 0 });
    bus.register(failConsumer);
    bus.register(successConsumer);

    await bus.publish(makeEvent());

    expect(failConsumer.handle).toHaveBeenCalled();
    expect(successConsumer.handle).toHaveBeenCalledOnce();
  });
});
