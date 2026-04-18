/**
 * Punch Events worker — consumes the durable BullMQ queue `punch-events`
 * produced by `punchEventsQueueBridge` (AD-02).
 *
 * Phase 4 handler: MOCK. Logs every received job and returns `{ processed: true }`.
 * Real per-job handlers land in later phases:
 *   - phase 6/7: payroll aggregation & overtime detection
 *   - phase 7:  timebank accrual
 *   - phase 6:  eSocial S-1200 / S-1210 builder
 *   - phase 11: outbound webhooks
 *
 * Kept minimal on purpose so the durable queue is exercised end-to-end and
 * AD-02's literal requirement ("eventos vão pela BullMQ queue") is satisfied
 * without speculative business logic.
 */

import type { Job } from 'bullmq';

import type { PunchEventQueuePayload } from '@/lib/events/consumers/punch-events-queue-bridge';
import { createWorker, QUEUE_NAMES } from '@/lib/queue';

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
        '[PunchEventsWorker] MOCK handler — job recebido; trabalho real em fases 6/7',
      );
      // Real per-job dispatchers land in later phases. Returning a stable
      // shape now keeps the contract obvious for tests.
      return { processed: true };
    },
    {
      // Low concurrency — phase 4 handler is a no-op, no need to fan out.
      // Real worker tuning in phase 7 when dashboard surfaces queue depth.
      concurrency: 2,
      limiter: {
        max: 100,
        duration: 1000,
      },
    },
  );
}
