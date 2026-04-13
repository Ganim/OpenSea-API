import { createQueue, createWorker, QUEUE_NAMES } from '@/lib/queue';
import { prisma } from '@/lib/prisma';
import { CheckBatchStatusUseCase } from '@/use-cases/hr/esocial/check-batch-status';

export interface EsocialBatchPollingJob {
  tenantId: string;
  batchId: string;
}

const QUEUE_NAME = QUEUE_NAMES.ESOCIAL_BATCH_POLLING;

let queueInstance: ReturnType<typeof createQueue<EsocialBatchPollingJob>>;

export function getEsocialBatchPollingQueue() {
  if (!queueInstance) {
    queueInstance = createQueue<EsocialBatchPollingJob>(QUEUE_NAME);
  }
  return queueInstance;
}

export function queueBatchPolling(
  data: EsocialBatchPollingJob,
  jobId?: string,
) {
  const queue = getEsocialBatchPollingQueue();
  return queue.add(QUEUE_NAME, data, {
    jobId,
    attempts: 3,
    backoff: { type: 'exponential', delay: 30_000 },
  });
}

export function startEsocialBatchPollingWorker() {
  createWorker<EsocialBatchPollingJob>(QUEUE_NAME, async (job) => {
    const { tenantId, batchId } = job.data;

    console.log(
      `[eSocial] Checking batch status: ${batchId} (tenant: ${tenantId})`,
    );

    const useCase = new CheckBatchStatusUseCase();
    const result = await useCase.execute({ tenantId, batchId });

    console.log(
      `[eSocial] Batch ${batchId}: status=${result.status}, accepted=${result.acceptedCount}, rejected=${result.rejectedCount}`,
    );
  });
}

/**
 * Finds all TRANSMITTING batches across all tenants and enqueues
 * a status check job for each.
 */
export async function enqueuePendingBatchChecks() {
  const transmittingBatches = await prisma.esocialBatch.findMany({
    where: {
      status: { in: ['TRANSMITTING', 'TRANSMITTED'] },
      protocol: { not: null },
    },
    select: {
      id: true,
      tenantId: true,
    },
  });

  if (transmittingBatches.length === 0) return;

  const queue = getEsocialBatchPollingQueue();

  for (const batch of transmittingBatches) {
    const jobId = `esocial-batch-${batch.id}`;

    const existing = await queue.getJob(jobId);
    if (existing) {
      const state = await existing.getState();
      if (state === 'active' || state === 'waiting' || state === 'delayed') {
        continue;
      }
      await existing.remove().catch(() => {});
    }

    await queueBatchPolling(
      { tenantId: batch.tenantId, batchId: batch.id },
      jobId,
    );
  }

  console.log(
    `[eSocial] Enqueued ${transmittingBatches.length} batch status check(s)`,
  );
}
