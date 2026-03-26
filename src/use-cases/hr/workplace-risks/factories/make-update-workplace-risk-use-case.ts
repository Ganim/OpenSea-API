import { PrismaWorkplaceRisksRepository } from '@/repositories/hr/prisma/prisma-workplace-risks-repository';
import { UpdateWorkplaceRiskUseCase } from '../update-workplace-risk';

export function makeUpdateWorkplaceRiskUseCase() {
  const workplaceRisksRepository = new PrismaWorkplaceRisksRepository();
  return new UpdateWorkplaceRiskUseCase(workplaceRisksRepository);
}
