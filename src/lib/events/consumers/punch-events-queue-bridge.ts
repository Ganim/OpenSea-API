/**
 * Punch → BullMQ queue bridge (AD-02).
 *
 * Forwards every `punch.*` domain event published via `typedEventBus` onto
 * the durable BullMQ queue `punch-events`. This is the single producer of
 * that queue — use cases MUST emit domain events via `typedEventBus.publish`
 * and let this bridge route jobs to BullMQ. Direct `addJob('punch-events', …)`
 * from use cases would bypass the event bus and break the audit trail.
 *
 * The worker consuming this queue is a mock in Phase 4 — real work (payroll
 * recompute, timebank accrual, eSocial S-1200/S-1210 builder) lands in
 * phases 6/7.
 */

import type { DomainEvent, EventConsumer } from '../domain-event.interface';
import { PUNCH_EVENTS } from '../punch-events';

import { addJob, QUEUE_NAMES } from '@/lib/queue';

export interface PunchEventQueuePayload {
  eventId: string;
  type: string;
  tenantId: string;
  source: string;
  sourceEntityType: string;
  sourceEntityId: string;
  data: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  occurredAt: string;
}

// Lazy logger to avoid @env initialization in unit tests
let _logger: {
  info: (obj: unknown, msg: string) => void;
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
        error: (obj, msg) => console.error(msg, obj),
      };
    }
  }
  return _logger!;
}

export const punchEventsQueueBridge: EventConsumer = {
  consumerId: 'punch.queue-bridge',
  moduleId: 'punch',
  // Subscribes to ALL punch.* events so every new event type is durable by
  // default. Adding a new entry to PUNCH_EVENTS automatically extends this.
  subscribesTo: Object.values(PUNCH_EVENTS),

  async handle(event: DomainEvent): Promise<void> {
    const payload: PunchEventQueuePayload = {
      eventId: event.id,
      type: event.type,
      tenantId: event.tenantId,
      source: event.source,
      sourceEntityType: event.sourceEntityType,
      sourceEntityId: event.sourceEntityId,
      data: event.data,
      metadata: event.metadata as Record<string, unknown> | undefined,
      occurredAt: event.timestamp,
    };

    try {
      await addJob<PunchEventQueuePayload>(QUEUE_NAMES.PUNCH_EVENTS, payload, {
        // Deduplicate at the BullMQ level using the domain event id. BullMQ
        // will silently drop a second enqueue with the same jobId — desirable
        // behavior for retries of the same logical event.
        jobId: event.id,
      });
    } catch (err) {
      getLogger().error(
        {
          eventId: event.id,
          type: event.type,
          error: err instanceof Error ? err.message : String(err),
        },
        '[PunchEventsQueueBridge] Falha ao enfileirar evento na queue punch-events',
      );
      throw err; // let typedEventBus retry with exponential backoff
    }
  },
};
