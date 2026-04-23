import { PrismaComplianceRubricaMapRepository } from '@/repositories/hr/prisma/prisma-compliance-rubrica-map-repository';

import { UpsertRubricaMapUseCase } from '../upsert-rubrica-map';

export function makeUpsertRubricaMapUseCase() {
  return new UpsertRubricaMapUseCase(
    new PrismaComplianceRubricaMapRepository(),
  );
}
