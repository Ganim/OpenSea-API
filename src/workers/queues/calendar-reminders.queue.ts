import type { Queue } from 'bullmq';
import { Job } from 'bullmq';
import {
  runCalendarRemindersJob,
  CalendarRemindersJobData,
} from '@/jobs/calendar/reminders.job';
import { logger } from '@/lib/logger';
import { createQueue, createWorker, QUEUE_NAMES } from '@/lib/queue';

const QUEUE_NAME = QUEUE_NAMES.CALENDAR_REMINDERS;

/** Every 60 seconds — matches the legacy in-process scheduler. */
const EVERY_MINUTE_MS = 60_000;

export const CALENDAR_REMINDERS_REPEAT_JOB_NAME = 'calendar-reminders-tick';

let queueInstance: Queue<CalendarRemindersJobData> | null = null;

export function getCalendarRemindersQueue(): Queue<CalendarRemindersJobData> {
  if (!queueInstance) {
    queueInstance = createQueue<CalendarRemindersJobData>(QUEUE_NAME);
  }
  return queueInstance;
}

export async function queueCalendarRemindersOnce(
  data: CalendarRemindersJobData = { trigger: 'manual' },
  options?: { jobId?: string },
) {
  return getCalendarRemindersQueue().add(QUEUE_NAME, data, {
    jobId: options?.jobId,
  });
}

export function startCalendarRemindersQueueWorker() {
  return createWorker<CalendarRemindersJobData>(
    QUEUE_NAME,
    async (job: Job<CalendarRemindersJobData>) => {
      await runCalendarRemindersJob(job.data ?? { trigger: 'cron' });
    },
    {
      concurrency: 1,
      limiter: { max: 1, duration: 1000 },
    },
  );
}

export async function scheduleCalendarRemindersRepeatable(): Promise<void> {
  const queue = getCalendarRemindersQueue();

  try {
    const existing = await queue.getRepeatableJobs();
    for (const job of existing) {
      if (job.name === CALENDAR_REMINDERS_REPEAT_JOB_NAME) {
        await queue.removeRepeatableByKey(job.key);
      }
    }
  } catch (err) {
    logger.warn(
      { err },
      '[CalendarRemindersQueue] Failed to clean up existing repeatables',
    );
  }

  await queue.add(
    CALENDAR_REMINDERS_REPEAT_JOB_NAME,
    { trigger: 'cron' },
    {
      repeat: { every: EVERY_MINUTE_MS },
      // 1-minute cadence — retries would pile up jobs if the DB is down.
      // Better to let the next tick handle it.
      attempts: 1,
    },
  );

  logger.info(
    { everyMs: EVERY_MINUTE_MS },
    '[CalendarRemindersQueue] Minute repeatable scheduled',
  );
}

export async function unscheduleCalendarRemindersRepeatable(): Promise<void> {
  const queue = getCalendarRemindersQueue();
  const existing = await queue.getRepeatableJobs();
  for (const job of existing) {
    if (job.name === CALENDAR_REMINDERS_REPEAT_JOB_NAME) {
      await queue.removeRepeatableByKey(job.key);
    }
  }
}
