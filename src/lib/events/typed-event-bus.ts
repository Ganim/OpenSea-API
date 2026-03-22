import { randomUUID } from 'node:crypto';

import type { EventLogRepository } from '@/repositories/events/event-log-repository';

import type { DomainEvent, EventConsumer } from './domain-event.interface';

// Lazy import to avoid @env initialization in unit tests
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

export interface TypedEventBusOptions {
  /** EventLog repository for persistence (optional — if not provided, events are not persisted) */
  eventLogRepository?: EventLogRepository;
  /** Default max retries for consumers */
  defaultMaxRetries?: number;
  /** Default base backoff in ms for exponential backoff */
  defaultBackoffMs?: number;
}

/**
 * TypedEventBus — Extends the event bus pattern with:
 * - Typed DomainEvent schema
 * - EventLog persistence (audit trail)
 * - Consumer registration with retry/dead-letter handling
 * - Exponential backoff on consumer failures
 *
 * This is the Phase 1 in-process implementation.
 * Phase 2 will swap the transport to NATS while keeping the same interface.
 */
export class TypedEventBus {
  private consumers: EventConsumer[] = [];
  private eventLogRepo: EventLogRepository | undefined;
  private defaultMaxRetries: number;
  private defaultBackoffMs: number;

  constructor(options: TypedEventBusOptions = {}) {
    this.eventLogRepo = options.eventLogRepository;
    this.defaultMaxRetries = options.defaultMaxRetries ?? 3;
    this.defaultBackoffMs = options.defaultBackoffMs ?? 1000;
  }

  /**
   * Register a consumer for specific event types.
   */
  register(consumer: EventConsumer): void {
    this.consumers.push(consumer);
  }

  /**
   * Remove a consumer by its ID (useful for tests).
   */
  unregister(consumerId: string): void {
    this.consumers = this.consumers.filter((c) => c.consumerId !== consumerId);
  }

  /**
   * Remove all consumers (useful for tests).
   */
  clear(): void {
    this.consumers = [];
  }

  /**
   * Get all registered consumers.
   */
  getConsumers(): ReadonlyArray<EventConsumer> {
    return this.consumers;
  }

  /**
   * Get consumers subscribed to a specific event type.
   */
  getConsumersForEvent(eventType: string): EventConsumer[] {
    return this.consumers.filter((c) => c.subscribesTo.includes(eventType));
  }

  /**
   * Publish a typed domain event.
   *
   * 1. Persists the event to EventLog (if repository is configured)
   * 2. Dispatches to all matching consumers
   * 3. Handles retries with exponential backoff on failure
   * 4. Marks as DEAD_LETTER after max retries exhausted
   */
  async publish(
    event: Omit<DomainEvent, 'id' | 'timestamp'> & {
      id?: string;
      timestamp?: string;
    },
  ): Promise<DomainEvent> {
    const fullEvent: DomainEvent = {
      id: event.id ?? randomUUID(),
      timestamp: event.timestamp ?? new Date().toISOString(),
      ...event,
    };

    // 1. Persist to EventLog
    if (this.eventLogRepo) {
      try {
        await this.eventLogRepo.create({
          id: fullEvent.id,
          tenantId: fullEvent.tenantId,
          type: fullEvent.type,
          version: fullEvent.version,
          source: fullEvent.source,
          sourceEntityType: fullEvent.sourceEntityType,
          sourceEntityId: fullEvent.sourceEntityId,
          data: fullEvent.data,
          metadata: fullEvent.metadata
            ? (fullEvent.metadata as Record<string, unknown>)
            : null,
          correlationId: fullEvent.metadata?.correlationId ?? null,
          causationId: fullEvent.metadata?.causationId ?? null,
        });
      } catch (err) {
        getLogger().error(
          { eventId: fullEvent.id, type: fullEvent.type, error: err },
          '[TypedEventBus] Failed to persist event to EventLog',
        );
        // Continue dispatching even if persistence fails
      }
    }

    // 2. Dispatch to matching consumers
    const matchingConsumers = this.getConsumersForEvent(fullEvent.type);

    if (matchingConsumers.length === 0) {
      return fullEvent;
    }

    const processedBy: string[] = [];
    const failedConsumers: Record<string, string> = {};

    await Promise.allSettled(
      matchingConsumers.map(async (consumer) => {
        try {
          await this.executeWithRetry(consumer, fullEvent);
          processedBy.push(consumer.consumerId);
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          failedConsumers[consumer.consumerId] = errorMessage;
          getLogger().error(
            {
              eventId: fullEvent.id,
              type: fullEvent.type,
              consumerId: consumer.consumerId,
              error: err,
            },
            `[TypedEventBus] Consumer "${consumer.consumerId}" failed permanently for event "${fullEvent.type}"`,
          );
        }
      }),
    );

    // 3. Update EventLog status
    if (this.eventLogRepo) {
      try {
        const allSucceeded = Object.keys(failedConsumers).length === 0;
        const allFailed =
          processedBy.length === 0 && matchingConsumers.length > 0;

        if (allSucceeded) {
          await this.eventLogRepo.updateStatus(fullEvent.id, 'PROCESSED', {
            processedBy,
            processedAt: new Date(),
          });
        } else if (allFailed) {
          await this.eventLogRepo.updateStatus(fullEvent.id, 'DEAD_LETTER', {
            processedBy,
            failedConsumers,
          });
        } else {
          // Partial failure
          await this.eventLogRepo.updateStatus(fullEvent.id, 'FAILED', {
            processedBy,
            failedConsumers,
          });
        }
      } catch (err) {
        getLogger().error(
          { eventId: fullEvent.id, error: err },
          '[TypedEventBus] Failed to update EventLog status',
        );
      }
    }

    return fullEvent;
  }

  /**
   * Execute a consumer with retry logic and exponential backoff.
   * Throws if all retries are exhausted.
   */
  private async executeWithRetry(
    consumer: EventConsumer,
    event: DomainEvent,
  ): Promise<void> {
    const maxRetries =
      consumer.retryStrategy?.maxRetries ?? this.defaultMaxRetries;
    const baseBackoff =
      consumer.retryStrategy?.backoffMs ?? this.defaultBackoffMs;

    let lastError: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        await consumer.handle(event);
        return; // Success
      } catch (err) {
        lastError = err;

        if (attempt < maxRetries) {
          // Exponential backoff: baseMs * 4^attempt (0, 1x, 4x, 16x, ...)
          const backoff =
            attempt === 0 ? 0 : baseBackoff * Math.pow(4, attempt - 1);
          if (backoff > 0) {
            await this.delay(backoff);
          }

          getLogger().warn(
            {
              eventId: event.id,
              type: event.type,
              consumerId: consumer.consumerId,
              attempt: attempt + 1,
              maxRetries,
              nextBackoff: baseBackoff * Math.pow(4, attempt),
              error: err,
            },
            `[TypedEventBus] Consumer "${consumer.consumerId}" failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying...`,
          );
        }
      }
    }

    throw lastError;
  }

  /** Delay utility - can be overridden in tests */
  protected delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/** Singleton instance - configured during application bootstrap */
let _typedEventBus: TypedEventBus | null = null;

export function getTypedEventBus(): TypedEventBus {
  if (!_typedEventBus) {
    _typedEventBus = new TypedEventBus();
  }
  return _typedEventBus;
}

export function setTypedEventBus(bus: TypedEventBus): void {
  _typedEventBus = bus;
}
