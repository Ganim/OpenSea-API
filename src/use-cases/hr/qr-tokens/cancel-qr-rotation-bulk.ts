import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { createQueue, QUEUE_NAMES } from '@/lib/queue';

export interface CancelQrRotationBulkRequest {
  tenantId: string;
  jobId: string;
}

export interface CancelQrRotationBulkResponse {
  cancelled: true;
}

/**
 * Cooperative cancellation of a QR-rotation bulk job (D-14 cancel endpoint).
 *
 * The worker reads `job.data.cancelled` between chunks; setting the flag
 * stops subsequent chunks from starting while letting the in-flight chunk
 * finish (best-effort per T-QR-01 / WorkerFailOpen-01 mitigations).
 *
 * Tenant scoping: the job payload carries `tenantId`, so we double-check
 * the caller is allowed to cancel this specific job.
 */
export class CancelQrRotationBulkUseCase {
  async execute(
    input: CancelQrRotationBulkRequest,
  ): Promise<CancelQrRotationBulkResponse> {
    const queue = createQueue(QUEUE_NAMES.QR_BATCH);
    const job = await queue.getJob(input.jobId);

    if (!job) {
      throw new ResourceNotFoundError('Job de rotação não encontrado');
    }

    const jobData = job.data as { tenantId?: string } | undefined;
    if (!jobData || jobData.tenantId !== input.tenantId) {
      // Do not leak existence across tenants.
      throw new ResourceNotFoundError('Job de rotação não encontrado');
    }

    await job.updateData({ ...jobData, cancelled: true });

    return { cancelled: true };
  }
}
