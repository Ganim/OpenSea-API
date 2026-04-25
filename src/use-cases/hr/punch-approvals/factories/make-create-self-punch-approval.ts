import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { PrismaPunchApprovalsRepository } from '@/repositories/hr/prisma/prisma-punch-approvals-repository';
import { PrismaTimeEntriesRepository } from '@/repositories/hr/prisma/prisma-time-entries-repository';
import { S3FileUploadService } from '@/services/storage/s3-file-upload-service';

import { CreateSelfPunchApprovalUseCase } from '../create-self-punch-approval';

/**
 * Phase 8 / Plan 08-01 — D-07/D-08.
 *
 * Factory canônica do `CreateSelfPunchApprovalUseCase`. Injeta:
 *  - `PrismaPunchApprovalsRepository` (production repo);
 *  - `PrismaEmployeesRepository` (resolve userId → employeeId);
 *  - `PrismaTimeEntriesRepository` (validação de ownership do timeEntryId);
 *  - `S3FileUploadService` (anti phantom-keys via headObject — Phase 7-03 D-10).
 *
 * Difere de `make-batch-resolve-punch-approvals.ts` (Phase 7-03) na ausência
 * do TypedEventBus — o use case não emite eventos: PunchApproval criada em
 * status PENDING aguarda gestor abrir/resolver para gerar `APPROVAL_RESOLVED`.
 */
export function makeCreateSelfPunchApprovalUseCase() {
  return new CreateSelfPunchApprovalUseCase(
    new PrismaPunchApprovalsRepository(),
    new PrismaEmployeesRepository(),
    new PrismaTimeEntriesRepository(),
    S3FileUploadService.getInstance(),
  );
}
