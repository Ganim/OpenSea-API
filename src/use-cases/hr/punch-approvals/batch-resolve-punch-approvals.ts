import type { TypedEventBus } from '@/lib/events';
import type { PunchApprovalsRepository } from '@/repositories/hr/punch-approvals-repository';
import type { FileUploadService } from '@/services/storage/file-upload-service';

import { ResolvePunchApprovalUseCase } from './resolve-punch-approval';

/**
 * Phase 7 / Plan 07-03 — D-09: batch-resolve com PIN gate.
 *
 * Gestor seleciona N aprovações pendentes e as resolve (APPROVE ou REJECT)
 * em uma única request. A justificativa (`note`) e as evidências
 * (`evidenceFileKeys`) são compartilhadas para todas as aprovações do lote.
 *
 * Execução:
 *  - chunks de 20 via `Promise.allSettled` (não all-or-nothing: 1 falha
 *    NÃO aborta as outras — o gestor precisa saber quantas resolveram);
 *  - cada item delega ao `ResolvePunchApprovalUseCase` já existente
 *    (double-resolve, tenant isolation, eventos APPROVAL_RESOLVED
 *    herdados sem re-implementação);
 *  - anti-DoS: rejeita `approvalIds.length > 100` (o schema Zod também
 *    enforce, mas a runtime guard protege chamadas internas);
 *  - empty array → short-circuit com zero.
 */
const MAX_BATCH_SIZE = 100;
const CHUNK_SIZE = 20;

export interface BatchResolvePunchApprovalsRequest {
  tenantId: string;
  resolverUserId: string;
  approvalIds: string[];
  decision: 'APPROVE' | 'REJECT';
  note?: string;
  evidenceFileKeys?: string[];
  linkedRequestId?: string;
}

export interface BatchResolvePunchApprovalsResultItem {
  approvalId: string;
  success: boolean;
  error?: string;
}

export interface BatchResolvePunchApprovalsResponse {
  results: BatchResolvePunchApprovalsResultItem[];
  totalSucceeded: number;
  totalFailed: number;
}

export class BatchResolvePunchApprovalsUseCase {
  constructor(
    private readonly punchApprovalsRepository: PunchApprovalsRepository,
    private readonly eventBus?: TypedEventBus,
    private readonly fileUploadService?: Pick<FileUploadService, 'headObject'>,
  ) {}

  async execute(
    input: BatchResolvePunchApprovalsRequest,
  ): Promise<BatchResolvePunchApprovalsResponse> {
    if (input.approvalIds.length === 0) {
      return { results: [], totalSucceeded: 0, totalFailed: 0 };
    }
    if (input.approvalIds.length > MAX_BATCH_SIZE) {
      // Guarded por schema Zod (max 100), mas defesa em profundidade para
      // callers internos (jobs / CLIs). Não é BadRequestError porque é
      // programmer error — evento interno.
      throw new Error(
        `approvalIds.length > ${MAX_BATCH_SIZE} não permitido (anti-DoS)`,
      );
    }

    const single = new ResolvePunchApprovalUseCase(
      this.punchApprovalsRepository,
      undefined,
      this.eventBus,
      this.fileUploadService,
    );

    const results: BatchResolvePunchApprovalsResultItem[] = [];

    for (let i = 0; i < input.approvalIds.length; i += CHUNK_SIZE) {
      const chunk = input.approvalIds.slice(i, i + CHUNK_SIZE);
      const settled = await Promise.allSettled(
        chunk.map(async (approvalId) => {
          await single.execute({
            tenantId: input.tenantId,
            approvalId,
            resolverUserId: input.resolverUserId,
            decision: input.decision,
            note: input.note,
            evidenceFileKeys: input.evidenceFileKeys,
            linkedRequestId: input.linkedRequestId,
          });
          return approvalId;
        }),
      );

      settled.forEach((outcome, idx) => {
        const approvalId = chunk[idx];
        if (outcome.status === 'fulfilled') {
          results.push({ approvalId, success: true });
        } else {
          const reason = outcome.reason;
          results.push({
            approvalId,
            success: false,
            error:
              reason instanceof Error ? reason.message : String(reason ?? ''),
          });
        }
      });
    }

    return {
      results,
      totalSucceeded: results.filter((r) => r.success).length,
      totalFailed: results.filter((r) => !r.success).length,
    };
  }
}
