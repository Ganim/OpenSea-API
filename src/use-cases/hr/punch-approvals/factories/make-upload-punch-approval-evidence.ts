import { S3FileUploadService } from '@/services/storage/s3-file-upload-service';

import { UploadPunchApprovalEvidenceUseCase } from '../upload-punch-approval-evidence';

/**
 * Phase 7 / Plan 07-03 — D-10. Factory do upload de evidência PDF.
 *
 * Usa o singleton `S3FileUploadService` (cache de presigned URLs shared)
 * e injeta apenas o slice `uploadWithKey` via structural typing no
 * constructor — o use case não precisa das outras 7 APIs do service.
 */
export function makeUploadPunchApprovalEvidenceUseCase() {
  return new UploadPunchApprovalEvidenceUseCase(
    S3FileUploadService.getInstance(),
  );
}
