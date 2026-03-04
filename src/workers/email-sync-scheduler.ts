import { logger } from '@/lib/logger';
import { PrismaEmailAccountsRepository } from '@/repositories/email/prisma/prisma-email-accounts-repository';
import { queueEmailSync } from './queues/email-sync.queue';

const INTERVAL_MS = 5 * 60 * 1000;

async function scheduleSyncJobs() {
  const emailAccountsRepository = new PrismaEmailAccountsRepository();

  try {
    const accounts = await emailAccountsRepository.listActive();

    for (const account of accounts) {
      // Use fixed jobId to prevent duplicate jobs within a 5-minute window.
      // Rotating the ID by time bucket ensures new jobs can be scheduled even if
      // a previous job permanently failed (maxAttempts exhausted).
      const bucketMinutes = Math.floor(Date.now() / INTERVAL_MS);
      const jobId = `email-sync-${account.id.toString()}-${bucketMinutes}`;
      await queueEmailSync(
        {
          tenantId: account.tenantId.toString(),
          accountId: account.id.toString(),
        },
        { jobId },
      );
    }

    if (accounts.length > 0) {
      logger.info(
        { count: accounts.length },
        'Scheduled email sync jobs for active accounts',
      );
    }
  } catch (err) {
    logger.error({ err }, 'Failed to schedule email sync jobs');
    throw err;
  }
}

// Initial run + start interval
try {
  await scheduleSyncJobs();
  setInterval(scheduleSyncJobs, INTERVAL_MS);
  logger.info(
    { interval: INTERVAL_MS },
    'Email sync scheduler worker started successfully',
  );
} catch {
  logger.error('Failed to start email sync scheduler worker');
}
