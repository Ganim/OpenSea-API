import { PrismaComplianceArtifactRepository } from '@/repositories/hr/prisma/prisma-compliance-artifact-repository';
import { S3FileUploadService } from '@/services/storage/s3-file-upload-service';

import { GetComplianceArtifactDownloadUrlUseCase } from '../get-compliance-artifact-download-url';

/**
 * Phase 06 / Plan 06-06 — factory do `GetComplianceArtifactDownloadUrlUseCase`.
 *
 * Injeta o repositório Prisma + S3FileUploadService singleton (mantém cache
 * de presigned URLs no runtime).
 */
export function makeGetComplianceArtifactDownloadUrlUseCase() {
  return new GetComplianceArtifactDownloadUrlUseCase(
    new PrismaComplianceArtifactRepository(),
    S3FileUploadService.getInstance(),
  );
}
