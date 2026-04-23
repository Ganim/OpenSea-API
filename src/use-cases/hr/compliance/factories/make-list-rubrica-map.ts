import { PrismaComplianceRubricaMapRepository } from '@/repositories/hr/prisma/prisma-compliance-rubrica-map-repository';

import { ListRubricaMapUseCase } from '../list-rubrica-map';

export function makeListRubricaMapUseCase() {
  return new ListRubricaMapUseCase(new PrismaComplianceRubricaMapRepository());
}
