import { getTypedEventBus } from '@/lib/events';
import { PrismaPunchApprovalsRepository } from '@/repositories/hr/prisma/prisma-punch-approvals-repository';
import { S3FileUploadService } from '@/services/storage/s3-file-upload-service';

import { ResolvePunchApprovalUseCase } from '../resolve-punch-approval';

/**
 * Factory base do ResolvePunchApprovalUseCase (sem fluxo de correção Phase 6-02;
 * para isso use `makeResolvePunchApprovalWithCorrectionUseCase`).
 *
 * Phase 7 / Plan 07-03 — D-09/D-10: agora injeta `S3FileUploadService` +
 * `TypedEventBus` para habilitar anexo de evidências PDF e emitir o evento
 * `PUNCH_EVENTS.APPROVAL_RESOLVED`. Controllers que chamam este factory sem
 * `evidenceFileKeys` no body continuam funcionando — o use case só invoca
 * `headObject` quando a lista é não-vazia.
 */
export function makeResolvePunchApprovalUseCase() {
  return new ResolvePunchApprovalUseCase(
    new PrismaPunchApprovalsRepository(),
    undefined,
    getTypedEventBus(),
    S3FileUploadService.getInstance(),
  );
}
