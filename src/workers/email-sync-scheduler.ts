import { logger } from '@/lib/logger';
import { PrismaEmailAccountsRepository } from '@/repositories/email/prisma/prisma-email-accounts-repository';
import { queueEmailSync } from './queues/email-sync.queue';

const INTERVAL_MS = 5 * 60 * 1000;

let intervalId: ReturnType<typeof setInterval> | null = null;
let consecutiveErrors = 0;
const MAX_CONSECUTIVE_ERRORS = 5;

async function scheduleSyncJobs() {
  const emailAccountsRepository = new PrismaEmailAccountsRepository();

  try {
    const accounts = await emailAccountsRepository.listActive();

    for (const account of accounts) {
      // Fixed jobId per account — BullMQ deduplicates so only one job per
      // account can be queued at a time, preventing parallel syncs.
      const jobId = `email-sync-${account.id.toString()}`;
      await queueEmailSync(
        {
          tenantId: account.tenantId.toString(),
          accountId: account.id.toString(),
        },
        { jobId },
      );
    }

    consecutiveErrors = 0;

    if (accounts.length > 0) {
      logger.info(
        { count: accounts.length },
        'Scheduled email sync jobs for active accounts',
      );
    }
  } catch (err) {
    consecutiveErrors++;
    logger.error(
      { err, consecutiveErrors, maxErrors: MAX_CONSECUTIVE_ERRORS },
      'Failed to schedule email sync jobs',
    );
    if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
      logger.error(
        `Email sync scheduler stopping after ${MAX_CONSECUTIVE_ERRORS} consecutive failures`,
      );
      stopEmailSyncScheduler();
    }
  }
}

export function stopEmailSyncScheduler() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    logger.info('Email sync scheduler stopped');
  }
}

/**
 * Starts the scheduler: runs an initial sync pass then repeats on a fixed interval.
 * Safe to call once from the worker entrypoint.
 */
export async function startEmailSyncScheduler(): Promise<void> {
  await scheduleSyncJobs();
  intervalId = setInterval(scheduleSyncJobs, INTERVAL_MS);
  logger.info(
    { interval: INTERVAL_MS },
    'Email sync scheduler started successfully',
  );
}
