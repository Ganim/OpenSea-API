import { PrismaComplianceArtifactRepository } from '@/repositories/hr/prisma/prisma-compliance-artifact-repository';
import { PrismaComplianceRubricaMapRepository } from '@/repositories/hr/prisma/prisma-compliance-rubrica-map-repository';
import { S3FileUploadService } from '@/services/storage/s3-file-upload-service';

import { BuildS1200ForCompetenciaUseCase } from '../build-s1200-for-competencia';

/**
 * Phase 06 / Plan 06-05 — factory do `BuildS1200ForCompetenciaUseCase`.
 *
 * Injeta repositórios Prisma + S3FileUploadService singleton. Controller é quem
 * resolve o dataset pesado (Tenant + EsocialConfig + Employees + Payroll +
 * TimeBank) via queries Prisma antes de chamar o use case — mesma orquestração
 * de AFD/AFDT/FolhaEspelho (Plans 06-02 e 06-04).
 */
export function makeBuildS1200ForCompetenciaUseCase() {
  return new BuildS1200ForCompetenciaUseCase(
    new PrismaComplianceRubricaMapRepository(),
    new PrismaComplianceArtifactRepository(),
    S3FileUploadService.getInstance(),
  );
}
