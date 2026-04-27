/**
 * Punch Events worker — consumes the durable BullMQ queue `punch-events`
 * produced by `punchEventsQueueBridge` (AD-02).
 *
 * Phase 4 handler: MOCK. Logs every received job and returns `{ processed: true }`.
 * Real per-job handlers land in later phases:
 *   - phase 6/7: payroll aggregation & overtime detection
 *   - phase 7:  timebank accrual
 *   - phase 6:  eSocial S-1200 / S-1210 builder
 *   - phase 9:  punch notifications (missed-punch, face-match-fail-3x) — Plan 09-04
 *   - phase 11: outbound webhooks
 *
 * Architectural Decision (Plan 09-04): This is the singleton dispatcher for punch events.
 * All event type handlers (processors) delegate to this worker via a switch statement.
 * Processors are pure, testable functions exported from their consumer modules
 * (missed-punch-notification-consumer, face-match-fail-3x-notification-consumer, etc).
 * No separate BullMQ workers are created per consumer (maintains Redis quota efficiency).
 */

import type { Job } from 'bullmq';

import type { PunchEventQueuePayload } from '@/lib/events/consumers/punch-events-queue-bridge';
import { PUNCH_EVENTS } from '@/lib/events/punch-events';
import { createWorker, QUEUE_NAMES } from '@/lib/queue';
import { processMissedPunchNotifications } from './missed-punch-notification-consumer';
import { processFaceMatchFail3xNotification } from './face-match-fail-3x-notification-consumer';

// Lazy logger (same pattern as other workers / consumers).
let _logger: {
  info: (obj: unknown, msg: string) => void;
} | null = null;
function getLogger() {
  if (!_logger) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      _logger = require('@/lib/logger').logger;
    } catch {
      _logger = {
        info: (obj, msg) => console.log(msg, obj),
      };
    }
  }
  return _logger!;
}

export function startPunchEventsWorker() {
  return createWorker<PunchEventQueuePayload>(
    QUEUE_NAMES.PUNCH_EVENTS,
    async (job: Job<PunchEventQueuePayload>) => {
      getLogger().info(
        {
          jobId: job.id,
          eventId: job.data.eventId,
          type: job.data.type,
          tenantId: job.data.tenantId,
          sourceEntityId: job.data.sourceEntityId,
        },
        '[PunchEventsWorker] dispatching by event type',
      );

      // Dispatch to appropriate processor based on event type.
      // Phase 9 Plan 09-04: notification consumers (missed-punch, face-match-fail-3x).
      // Phase 4-phase 8 event types fall through to default MOCK behavior.
      switch (job.data.type) {
        case PUNCH_EVENTS.MISSED_PUNCHES_DETECTED:
          return processMissedPunchNotifications(job);

        case PUNCH_EVENTS.FACE_MATCH_FAIL_3X:
          return processFaceMatchFail3xNotification(job);

        default:
          // Phase 4 MOCK behavior preserved for all other event types.
          // Real per-job handlers land in later phases (phase 6/7, 11, etc).
          return { processed: true };
      }
    },
    {
      // Low concurrency — consumers are non-blocking (dispatch to notification module).
      // Real worker tuning in phase 7 when dashboard surfaces queue depth.
      concurrency: 2,
      limiter: {
        max: 100,
        duration: 1000,
      },
    },
  );
}
