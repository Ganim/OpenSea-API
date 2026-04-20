import { PrismaComplianceArtifactRepository } from '@/repositories/hr/prisma/prisma-compliance-artifact-repository';
import { S3FileUploadService } from '@/services/storage/s3-file-upload-service';
import { GenerateAfdUseCase } from '../generate-afd';

/**
 * Phase 06 / Plan 06-02 — factory de `GenerateAfdUseCase`.
 *
 * Injeta o repositório Prisma de `ComplianceArtifact` + singleton do
 * `S3FileUploadService` (R2 storage). Use case puro recebe o dataset já
 * resolvido (header/empresas/empregados/marcações), de modo que o
 * controller HTTP é responsável por buscar Tenant + EsocialConfig +
 * Employees + TimeEntries antes de chamar.
 *
 * Esta separação mantém o use case 100% testável com fixtures (in-memory
 * compliance repo + fake S3) — o controller é o único lugar com acesso
 * direto ao Prisma para consultas pesadas.
 */
export function makeGenerateAfdUseCase() {
  return new GenerateAfdUseCase(
    new PrismaComplianceArtifactRepository(),
    S3FileUploadService.getInstance(),
  );
}
