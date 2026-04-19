/**
 * Bulk dispatch queue — fans out large recipient sets (e.g. HR announcement
 * for 10k employees) asynchronously so the originating HTTP request doesn't
 * block on a massive Promise.all().
 *
 * Contract (never changes synchronous `dispatch()`):
 *   Synchronous path — `notificationClient.dispatch()` for 1 recipient.
 *   Async path       — `notificationClient.dispatchBulkAsync()` for many.
 *
 * The async variant persists the intent (`DispatchNotificationInput`) and
 * returns a jobId immediately. The worker below replays it through the real
 * dispatcher, which internally already applies preferences, idempotency,
 * and fan-out to channel adapters.
 */

import type { Job, Queue } from 'bullmq';
import { randomUUID } from 'node:crypto';
import { logger } from '@/lib/logger';
import { createQueue, createWorker, QUEUE_NAMES } from '@/lib/queue';

import type { DispatchNotificationInput } from '../../modules/notifications/public';

export interface NotificationBulkDispatchJobData {
  jobId: string;
  input: DispatchNotificationInput;
}

let _queue: Queue<NotificationBulkDispatchJobData> | null = null;

export function getNotificationBulkDispatchQueue(): Queue<NotificationBulkDispatchJobData> {
  if (!_queue) {
    _queue = createQueue<NotificationBulkDispatchJobData>(
      QUEUE_NAMES.NOTIFICATION_BULK_DISPATCH,
    );
  }
  return _queue;
}

export async function enqueueBulkDispatch(
  input: DispatchNotificationInput,
): Promise<{ jobId: string }> {
  const jobId = randomUUID();
  await getNotificationBulkDispatchQueue().add(
    QUEUE_NAMES.NOTIFICATION_BULK_DISPATCH,
    { jobId, input },
    { jobId },
  );
  return { jobId };
}

export function startNotificationBulkDispatchWorker() {
  return createWorker<NotificationBulkDispatchJobData>(
    QUEUE_NAMES.NOTIFICATION_BULK_DISPATCH,
    async (job: Job<NotificationBulkDispatchJobData>) => {
      const { jobId, input } = job.data;

      // Lazy import — avoid dispatcher bootstrap running inside queue module load.
      const { notificationClient } = await import(
        '../../modules/notifications/public/index.js'
      );

      const result = await notificationClient.dispatch(input);

      logger.info(
        {
          jobId,
          category: input.category,
          recipientCount: result.recipientCount,
          suppressedByPreference: result.suppressedByPreference,
          deduplicated: result.deduplicated,
        },
        '[notification-bulk-dispatch] fan-out completed',
      );
    },
    {
      concurrency: 3,
      limiter: {
        max: 5,
        duration: 1_000, // 5 bulk orchestrations per second
      },
    },
  );
}
