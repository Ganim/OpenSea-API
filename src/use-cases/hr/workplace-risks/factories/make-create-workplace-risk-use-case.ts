import { PrismaSafetyProgramsRepository } from '@/repositories/hr/prisma/prisma-safety-programs-repository';
import { PrismaWorkplaceRisksRepository } from '@/repositories/hr/prisma/prisma-workplace-risks-repository';
import { CreateWorkplaceRiskUseCase } from '../create-workplace-risk';

export function makeCreateWorkplaceRiskUseCase() {
  const workplaceRisksRepository = new PrismaWorkplaceRisksRepository();
  const safetyProgramsRepository = new PrismaSafetyProgramsRepository();
  return new CreateWorkplaceRiskUseCase(
    workplaceRisksRepository,
    safetyProgramsRepository,
  );
}
