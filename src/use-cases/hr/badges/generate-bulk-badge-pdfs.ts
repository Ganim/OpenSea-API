import { createHash } from 'node:crypto';

import { addJob, QUEUE_NAMES } from '@/lib/queue';
import type { EmployeesRepository } from '@/repositories/hr/employees-repository';

/**
 * Scope of a bulk crachá PDF generation request (Plan 05-06 Task 2).
 * Mirrors `RotateQrTokensBulkUseCase` — admins typically reuse the same
 * scope concept across QR rotation and crachá reprints.
 */
export type BulkBadgeScope = 'ALL' | 'DEPARTMENT' | 'CUSTOM';

export interface GenerateBulkBadgePdfsRequest {
  tenantId: string;
  scope: BulkBadgeScope;
  /** Required when `scope === 'CUSTOM'`. */
  employeeIds?: string[];
  /** Required when `scope === 'DEPARTMENT'`. */
  departmentIds?: string[];
  /** Subject id of the admin initiating the bulk reprint. */
  invokedByUserId: string;
}

export interface GenerateBulkBadgePdfsResponse {
  /** Deterministic job id; `null` when the scope resolved to zero employees. */
  jobId: string | null;
  /** How many crachás the worker will produce. */
  total: number;
}

/**
 * Enqueues a BullMQ job on `QUEUE_NAMES.BADGE_PDF` (D-13 bulk crachá print).
 *
 * Behavior:
 *   - Resolves the target employee-id list based on the `scope` (shape identical
 *     to {@link RotateQrTokensBulkUseCase} so the admin UX stays consistent).
 *   - If the list is empty → `{ jobId: null, total: 0 }` without enqueueing
 *     (UX: nothing to do).
 *   - Otherwise computes a deterministic jobId
 *     `sha256(tenantId|badge-pdf|sorted(ids)).slice(0, 16)` so a retried
 *     request dedupes against the already-queued BullMQ job.
 *   - Enqueues the worker payload with `rotateTokens: true` — the worker
 *     itself rotates each employee inline before rendering, matching the
 *     D-14 bulk "gerar crachás novos e reimprimir" semantics. Standalone
 *     invocation always rotates; only the sub-job enqueued by
 *     `qrBatchWorker` (Plan 05-04) bypasses rotation by supplying
 *     pre-rotated tokens in `payload.tokens`.
 */
export class GenerateBulkBadgePdfsUseCase {
  constructor(private readonly employeesRepo: EmployeesRepository) {}

  async execute(
    input: GenerateBulkBadgePdfsRequest,
  ): Promise<GenerateBulkBadgePdfsResponse> {
    const employeeIds = await this.resolveEmployeeIds(input);

    if (employeeIds.length === 0) {
      return { jobId: null, total: 0 };
    }

    const sortedIds = [...employeeIds].sort().join(',');
    const jobId = createHash('sha256')
      .update(`${input.tenantId}|badge-pdf|${sortedIds}`)
      .digest('hex')
      .slice(0, 16);

    await addJob(
      QUEUE_NAMES.BADGE_PDF,
      {
        tenantId: input.tenantId,
        scope: 'CUSTOM',
        employeeIds,
        invokedByUserId: input.invokedByUserId,
        rotateTokens: true,
      },
      { jobId },
    );

    return { jobId, total: employeeIds.length };
  }

  private async resolveEmployeeIds(
    input: GenerateBulkBadgePdfsRequest,
  ): Promise<string[]> {
    if (input.scope === 'CUSTOM') {
      const provided = input.employeeIds ?? [];
      if (provided.length === 0) return [];
      // Validate every provided id belongs to the tenant (prevents cross-
      // tenant PDF generation via a crafted body).
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
