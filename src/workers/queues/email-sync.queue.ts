import { logger } from '@/lib/logger';
import { createQueue, createWorker, QUEUE_NAMES } from '@/lib/queue';
import { makeSyncEmailAccountUseCase } from '@/use-cases/email/sync/factories/make-sync-email-account-use-case';
import { Job } from 'bullmq';

export interface EmailSyncJobData {
  tenantId: string;
  accountId: string;
}

export const emailSyncQueue = createQueue<EmailSyncJobData>(
  QUEUE_NAMES.EMAIL_SYNC,
);

export async function queueEmailSync(
  data: EmailSyncJobData,
  options?: {
    delay?: number;
    priority?: number;
    jobId?: string;
  },
) {
  return emailSyncQueue.add(QUEUE_NAMES.EMAIL_SYNC, data, {
    delay: options?.delay,
    priority: options?.priority,
    jobId: options?.jobId,
  });
}

export function startEmailSyncWorker() {
  return createWorker<EmailSyncJobData>(
    QUEUE_NAMES.EMAIL_SYNC,
    async (job: Job<EmailSyncJobData>) => {
      const useCase = makeSyncEmailAccountUseCase();
      try {
        await useCase.execute({
          tenantId: job.data.tenantId,
          accountId: job.data.accountId,
        });
      } catch (error) {
        logger.error(
          {
            err: error,
            jobId: job.id,
            tenantId: job.data.tenantId,
            accountId: job.data.accountId,
          },
          'Email sync job failed',
        );
        throw error;
      }
    },
    {
      concurrency: 2,
      limiter: {
        max: 5,
        duration: 1000,
      },
    },
  );
}
