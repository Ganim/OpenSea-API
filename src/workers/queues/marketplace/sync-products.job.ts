import { logger } from '@/lib/logger';
import { createQueue, createWorker, QUEUE_NAMES } from '@/lib/queue';
import type { Queue, Job } from 'bullmq';

export interface SyncProductsJobData {
  tenantId: string;
  connectionId: string;
  /** Product IDs to sync. Empty array means full catalog sync. */
  productIds: string[];
}

const QUEUE_NAME = QUEUE_NAMES.MARKETPLACE_SYNC_PRODUCTS;

let _queue: Queue<SyncProductsJobData> | null = null;

function getQueue(): Queue<SyncProductsJobData> {
  if (!_queue) {
    _queue = createQueue<SyncProductsJobData>(QUEUE_NAME);
  }
  return _queue;
}

export function getMarketplaceSyncProductsQueue(): Queue<SyncProductsJobData> {
  return getQueue();
}

export async function queueSyncProducts(
  data: SyncProductsJobData,
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

export function startSyncProductsWorker() {
  return createWorker<SyncProductsJobData>(
    QUEUE_NAME,
    async (job: Job<SyncProductsJobData>) => {
      logger.info(
        {
          jobId: job.id,
          tenantId: job.data.tenantId,
          connectionId: job.data.connectionId,
          productCount: job.data.productIds.length,
        },
        'Starting marketplace product sync',
      );

      try {
        // TODO: Wire up SyncProductsToMarketplaceUseCase when available
        // const useCase = makeSyncProductsToMarketplaceUseCase();
        // await useCase.execute({
        //   tenantId: job.data.tenantId,
        //   connectionId: job.data.connectionId,
        //   productIds: job.data.productIds,
        // });

        logger.info(
          { jobId: job.id, tenantId: job.data.tenantId },
          'Marketplace product sync completed',
        );
      } catch (error) {
        logger.error(
          {
            err: error,
            jobId: job.id,
            tenantId: job.data.tenantId,
            connectionId: job.data.connectionId,
          },
          'Marketplace product sync failed',
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
