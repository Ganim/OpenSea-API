import { PrismaComplianceArtifactRepository } from '@/repositories/hr/prisma/prisma-compliance-artifact-repository';

import { ListComplianceArtifactsUseCase } from '../list-compliance-artifacts';

/**
 * Phase 06 / Plan 06-06 — factory do `ListComplianceArtifactsUseCase`.
 *
 * Injeta o repositório Prisma. Sem side effects — controller decide tenant + userId.
 */
export function makeListComplianceArtifactsUseCase() {
  return new ListComplianceArtifactsUseCase(
    new PrismaComplianceArtifactRepository(),
  );
}
