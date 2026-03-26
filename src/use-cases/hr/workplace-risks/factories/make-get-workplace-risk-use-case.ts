import { PrismaWorkplaceRisksRepository } from '@/repositories/hr/prisma/prisma-workplace-risks-repository';
import { GetWorkplaceRiskUseCase } from '../get-workplace-risk';

export function makeGetWorkplaceRiskUseCase() {
  const workplaceRisksRepository = new PrismaWorkplaceRisksRepository();
  return new GetWorkplaceRiskUseCase(workplaceRisksRepository);
}
