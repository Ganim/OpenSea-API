import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { PrismaEmailAccountsRepository } from '@/repositories/email/prisma/prisma-email-accounts-repository';
import { queueEmailSync, getEmailSyncQueueInstance } from './queues/email-sync.queue';

const INTERVAL_MS = 5 * 60 * 1000;

let intervalId: ReturnType<typeof setInterval> | null = null;
let consecutiveErrors = 0;
const MAX_CONSECUTIVE_ERRORS = 5;

async function scheduleSyncJobs() {
  const emailAccountsRepository = new PrismaEmailAccountsRepository();

  try {
    // Iterate per-tenant to ensure proper isolation
    const tenantIds = await prisma.emailAccount.findMany({
      where: { isActive: true },
      select: { tenantId: true },
      distinct: ['tenantId'],
    });

    const accounts = [];
    for (const { tenantId } of tenantIds) {
      const tenantAccounts = await emailAccountsRepository.listActive(tenantId);
      accounts.push(...tenantAccounts);
    }

    for (const account of accounts) {
      // Fixed jobId per account — prevents parallel syncs for the same account.
      // We must remove completed/failed jobs first, otherwise BullMQ silently
      // ignores re-adds with the same jobId.
      const jobId = `email-sync-${account.id.toString()}`;

      const queue = getEmailSyncQueueInstance();
      const existing = await queue.getJob(jobId);
      if (existing) {
        const state = await existing.getState();
        if (state === 'active' || state === 'waiting' || state === 'delayed') {
          // Sync already in progress or queued — skip this round
          continue;
        }
        // Remove completed/failed jobs so the new job can be added
        await existing.remove().catch((err) => {
          logger.warn({ err, jobId }, 'Failed to remove existing sync job before re-queue');
        });
      }

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
