import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { S3FileUploadService } from '@/services/storage/s3-file-upload-service';

import { UploadSelfPunchEvidenceUseCase } from '../upload-self-punch-evidence';

/**
 * Phase 8 / Plan 08-03 / Task 2 — D-08-03-01.
 *
 * Factory canônica do `UploadSelfPunchEvidenceUseCase`. Owner-only path
 * — funcionário próprio sobe foto/PDF (até 5MB) sem PIN gate.
 */
export function makeUploadSelfPunchEvidenceUseCase() {
  return new UploadSelfPunchEvidenceUseCase(
    new PrismaEmployeesRepository(),
    S3FileUploadService.getInstance(),
  );
}
