/**
 * Notification callback queue — reliably delivers HTTP callbacks back to the
 * module that originated an actionable notification after a user resolves it.
 *
 * Pipeline:
 *   notification.resolve() → NotificationCallbackJob row (status=PENDING)
 *                         → enqueue in BullMQ with initial delay 0
 *                         → POST callbackUrl with resolved payload
 *                         → success: callbackStatus=DELIVERED, deliveredAt=now
 *                         → failure: bump attempts, schedule retry with
 *                           exponential backoff (1s, 5s, 30s, 5min, 30min)
 *                         → after 5 attempts: callbackStatus=FAILED, DLQ
 */

import type { Job, Queue } from 'bullmq';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { createQueue, createWorker, QUEUE_NAMES } from '@/lib/queue';

export interface NotificationCallbackJobData {
  jobId: string; // NotificationCallbackJob.id
}

const RETRY_DELAYS_MS = [1_000, 5_000, 30_000, 5 * 60_000, 30 * 60_000];
const MAX_ATTEMPTS = RETRY_DELAYS_MS.length;

let _queue: Queue<NotificationCallbackJobData> | null = null;

export function getNotificationCallbacksQueue(): Queue<NotificationCallbackJobData> {
  if (!_queue) {
    _queue = createQueue<NotificationCallbackJobData>(
      QUEUE_NAMES.NOTIFICATION_CALLBACKS,
    );
  }
  return _queue;
}

/**
 * Enqueue a pending callback for delivery.
 * Called from NotificationDispatcher.resolve() after DB commit.
 */
export async function enqueueNotificationCallback(
  jobId: string,
  delayMs = 0,
): Promise<void> {
  await getNotificationCallbacksQueue().add(
    QUEUE_NAMES.NOTIFICATION_CALLBACKS,
    { jobId },
    {
      delay: delayMs,
      // We manage retries ourselves via DB state, so disable BullMQ internal
      // retry to avoid double-counting against MAX_ATTEMPTS.
      attempts: 1,
    },
  );
}

async function performHttpCallback(
  url: string,
  payload: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'OpenSea-Notifications/1.0',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      return {
        ok: false,
        error: `HTTP ${response.status} ${response.statusText}`,
      };
    }
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function processCallback(
  job: Job<NotificationCallbackJobData>,
): Promise<void> {
  const { jobId } = job.data;

  const row = await prisma.notificationCallbackJob.findUnique({
    where: { id: jobId },
  });

  if (!row) {
    logger.warn(
      { jobId },
      '[notification-callbacks] row missing, dropping job',
    );
    return;
  }

  if (row.status === 'DELIVERED' || row.status === 'NOT_APPLICABLE') {
    return;
  }

  const attempts = row.attempts + 1;

  const result = await performHttpCallback(row.callbackUrl, row.payload);

  if (result.ok) {
    await prisma.notificationCallbackJob.update({
      where: { id: jobId },
      data: {
        status: 'DELIVERED',
        attempts,
        deliveredAt: new Date(),
        lastError: null,
        nextAttemptAt: null,
      },
    });
    await prisma.notification.update({
      where: { id: row.notificationId },
      data: { callbackStatus: 'DELIVERED' },
    });
    return;
  }

  if (attempts >= MAX_ATTEMPTS) {
    await prisma.notificationCallbackJob.update({
      where: { id: jobId },
      data: {
        status: 'FAILED',
        attempts,
        lastError: result.error,
        nextAttemptAt: null,
      },
    });
    await prisma.notification.update({
      where: { id: row.notificationId },
      data: {
        callbackStatus: 'FAILED',
        callbackError: result.error.slice(0, 1000),
      },
    });
    throw new Error(
      `callback exhausted after ${MAX_ATTEMPTS} attempts: ${result.error}`,
    );
  }

  const delayMs = RETRY_DELAYS_MS[attempts] ?? RETRY_DELAYS_MS.at(-1)!;
  const nextAttemptAt = new Date(Date.now() + delayMs);

  await prisma.notificationCallbackJob.update({
    where: { id: jobId },
    data: {
      status: 'PENDING',
      attempts,
      lastError: result.error,
      nextAttemptAt,
    },
  });

  await enqueueNotificationCallback(jobId, delayMs);
}

export function startNotificationCallbacksWorker() {
  return createWorker<NotificationCallbackJobData>(
    QUEUE_NAMES.NOTIFICATION_CALLBACKS,
    processCallback,
    {
      concurrency: 5,
      limiter: {
        max: 20,
        duration: 1_000, // 20 callbacks/sec
      },
    },
  );
}
