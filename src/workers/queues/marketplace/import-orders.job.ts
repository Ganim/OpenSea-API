import { logger } from '@/lib/logger';
import { createQueue, createWorker, QUEUE_NAMES } from '@/lib/queue';
import type { Queue, Job } from 'bullmq';

export interface ImportOrdersJobData {
  tenantId: string;
  connectionId: string;
  /** ISO date string — import orders created/updated since this date */
  since: string;
}

const QUEUE_NAME = QUEUE_NAMES.MARKETPLACE_IMPORT_ORDERS;

let _queue: Queue<ImportOrdersJobData> | null = null;

function getQueue(): Queue<ImportOrdersJobData> {
  if (!_queue) {
    _queue = createQueue<ImportOrdersJobData>(QUEUE_NAME);
  }
  return _queue;
}

export function getMarketplaceImportOrdersQueue(): Queue<ImportOrdersJobData> {
  return getQueue();
}

export async function queueImportOrders(
  data: ImportOrdersJobData,
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

export function startImportOrdersWorker() {
  return createWorker<ImportOrdersJobData>(
    QUEUE_NAME,
    async (job: Job<ImportOrdersJobData>) => {
      logger.info(
        {
          jobId: job.id,
          tenantId: job.data.tenantId,
          connectionId: job.data.connectionId,
          since: job.data.since,
        },
        'Starting marketplace order import',
      );

      try {
        // TODO: Wire up ImportMarketplaceOrdersUseCase when available
        // const useCase = makeImportMarketplaceOrdersUseCase();
        // await useCase.execute({
        //   tenantId: job.data.tenantId,
        //   connectionId: job.data.connectionId,
        //   since: job.data.since,
        // });

        logger.info(
          { jobId: job.id, tenantId: job.data.tenantId },
          'Marketplace order import completed',
        );
      } catch (error) {
        logger.error(
          {
            err: error,
            jobId: job.id,
            tenantId: job.data.tenantId,
            connectionId: job.data.connectionId,
          },
          'Marketplace order import failed',
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
