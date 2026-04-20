import { PrismaComplianceArtifactRepository } from '@/repositories/hr/prisma/prisma-compliance-artifact-repository';
import { S3FileUploadService } from '@/services/storage/s3-file-upload-service';
import { GenerateAfdtUseCase } from '../generate-afdt';

/**
 * Phase 06 / Plan 06-02 — factory de `GenerateAfdtUseCase`.
 *
 * AFDT é o artefato proprietário OpenSea (D-05): mesmo layout do AFD oficial,
 * mas inclui também batidas com `adjustmentType=ADJUSTMENT_APPROVED`. NÃO é
 * o leiaute legal AEJ — o artefato exigido em auditoria continua sendo o AFD.
 *
 * Mesma injeção do `make-generate-afd`: repo Prisma + S3 singleton.
 */
export function makeGenerateAfdtUseCase() {
  return new GenerateAfdtUseCase(
    new PrismaComplianceArtifactRepository(),
    S3FileUploadService.getInstance(),
  );
}
