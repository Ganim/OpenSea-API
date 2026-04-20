import { createHash } from 'node:crypto';

import { addJob, QUEUE_NAMES } from '@/lib/queue';
import type { EmployeesRepository } from '@/repositories/hr/employees-repository';

export type BulkScope = 'ALL' | 'DEPARTMENT' | 'CUSTOM';

export interface RotateQrTokensBulkRequest {
  tenantId: string;
  scope: BulkScope;
  /** Required when `scope === 'CUSTOM'`. */
  employeeIds?: string[];
  /** Required when `scope === 'DEPARTMENT'`. */
  departmentIds?: string[];
  generatePdfs: boolean;
  /** Subject id of the admin triggering the bulk rotation. */
  invokedByUserId: string;
}

export interface RotateQrTokensBulkResponse {
  /** Deterministic job id; `null` when the scope resolved to zero employees. */
  jobId: string | null;
  /** How many employees will be rotated by the worker. */
  total: number;
  generatePdfs: boolean;
}

/**
 * Enqueues a BullMQ job on `QUEUE_NAMES.QR_BATCH` (D-14 bulk path).
 *
 * Behavior:
 *   - Resolves the target employee-id list based on the `scope`:
 *       ALL        → every non-terminated employee of the tenant
 *       DEPARTMENT → every employee whose `departmentId ∈ departmentIds`
 *       CUSTOM     → intersection of provided `employeeIds` with the tenant
 *   - If the list is empty, returns `{ jobId: null, total: 0 }` WITHOUT
 *     enqueueing anything (UX: nothing to do).
 *   - Otherwise computes a deterministic `jobId = sha256(tenantId|scope|
 *     sorted(ids)).slice(0, 16)` so a retried request dedupes against the
 *     already-queued BullMQ job (BullMQ `jobId` guarantees idempotency).
 *   - Enqueues the worker payload: `{ tenantId, employeeIds, generatePdfs,
 *     invokedByUserId }`. The worker itself is implemented in
 *     `qr-batch-worker.ts`.
 */
export class RotateQrTokensBulkUseCase {
  constructor(private readonly employeesRepo: EmployeesRepository) {}

  async execute(
    input: RotateQrTokensBulkRequest,
  ): Promise<RotateQrTokensBulkResponse> {
    const employeeIds = await this.resolveEmployeeIds(input);

    if (employeeIds.length === 0) {
      return {
        jobId: null,
        total: 0,
        generatePdfs: input.generatePdfs,
      };
    }

    const sortedIds = [...employeeIds].sort().join(',');
    const jobId = createHash('sha256')
      .update(`${input.tenantId}|${input.scope}|${sortedIds}`)
      .digest('hex')
      .slice(0, 16);

    await addJob(
      QUEUE_NAMES.QR_BATCH,
      {
        tenantId: input.tenantId,
        employeeIds,
        generatePdfs: input.generatePdfs,
        invokedByUserId: input.invokedByUserId,
      },
      { jobId },
    );

    return {
      jobId,
      total: employeeIds.length,
      generatePdfs: input.generatePdfs,
    };
  }

  private async resolveEmployeeIds(
    input: RotateQrTokensBulkRequest,
  ): Promise<string[]> {
    if (input.scope === 'CUSTOM') {
      const provided = input.employeeIds ?? [];
      if (provided.length === 0) return [];
      // Validate every provided id belongs to the tenant (prevents cross-
      // tenant rotation attempts via a crafted body).
      const validTenantIds = new Set(
        await this.employeesRepo.findAllIds(input.tenantId),
      );
      return provided.filter((id) => validTenantIds.has(id));
    }

    if (input.scope === 'DEPARTMENT') {
      return this.employeesRepo.findIdsByDepartments(
        input.departmentIds ?? [],
        input.tenantId,
      );
    }

    // scope === 'ALL'
    return this.employeesRepo.findAllIds(input.tenantId);
  }
}
