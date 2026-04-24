import { getTypedEventBus } from '@/lib/events';
import { PrismaPunchApprovalsRepository } from '@/repositories/hr/prisma/prisma-punch-approvals-repository';
import { S3FileUploadService } from '@/services/storage/s3-file-upload-service';

import { BatchResolvePunchApprovalsUseCase } from '../batch-resolve-punch-approvals';

/**
 * Phase 7 / Plan 07-03 — D-09. Factory canônico do batch-resolve.
 *
 * Injeta:
 *  - `PrismaPunchApprovalsRepository` (production repo);
 *  - `TypedEventBus` singleton (emissão de PUNCH_EVENTS.APPROVAL_RESOLVED
 *    delegada pelo `ResolvePunchApprovalUseCase` interno);
 *  - `S3FileUploadService.getInstance()` (para validar evidenceFileKeys
 *    via headObject antes de anexar ao PunchApproval — Warning #7).
 */
export function makeBatchResolvePunchApprovalsUseCase() {
  return new BatchResolvePunchApprovalsUseCase(
    new PrismaPunchApprovalsRepository(),
    getTypedEventBus(),
    S3FileUploadService.getInstance(),
  );
}
