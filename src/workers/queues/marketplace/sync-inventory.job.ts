import { logger } from '@/lib/logger';
import { createQueue, createWorker, QUEUE_NAMES } from '@/lib/queue';
import type { Queue, Job } from 'bullmq';

export interface SyncInventoryJobData {
  tenantId: string;
  connectionId: string;
}

const QUEUE_NAME = QUEUE_NAMES.MARKETPLACE_SYNC_INVENTORY;

let _queue: Queue<SyncInventoryJobData> | null = null;

function getQueue(): Queue<SyncInventoryJobData> {
  if (!_queue) {
    _queue = createQueue<SyncInventoryJobData>(QUEUE_NAME);
  }
  return _queue;
}

export function getMarketplaceSyncInventoryQueue(): Queue<SyncInventoryJobData> {
  return getQueue();
}

export async function queueSyncInventory(
  data: SyncInventoryJobData,
  options?: {
    delay?: number;
    priority?: number;
    jobId?: string;
  },
) {
  return getQueue().add(QUEUE_NAME, data, {
    delay: options?.delay,
    priority: options?.priority,
    jobId: options?.jobId,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 60_000,
    },
  });
}

export function startSyncInventoryWorker() {
  return createWorker<SyncInventoryJobData>(
    QUEUE_NAME,
    async (job: Job<SyncInventoryJobData>) => {
      logger.info(
        {
          jobId: job.id,
          tenantId: job.data.tenantId,
          connectionId: job.data.connectionId,
        },
        'Starting marketplace inventory sync',
      );

      try {
        // TODO: Wire up SyncInventoryToMarketplaceUseCase when available
        // const useCase = makeSyncInventoryToMarketplaceUseCase();
        // await useCase.execute({
        //   tenantId: job.data.tenantId,
        //   connectionId: job.data.connectionId,
        // });

        logger.info(
          { jobId: job.id, tenantId: job.data.tenantId },
          'Marketplace inventory sync completed',
        );
      } catch (error) {
        logger.error(
          {
            err: error,
            jobId: job.id,
            tenantId: job.data.tenantId,
            connectionId: job.data.connectionId,
          },
          'Marketplace inventory sync failed',
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
