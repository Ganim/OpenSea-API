import { PrismaWorkplaceRisksRepository } from '@/repositories/hr/prisma/prisma-workplace-risks-repository';
import { DeleteWorkplaceRiskUseCase } from '../delete-workplace-risk';

export function makeDeleteWorkplaceRiskUseCase() {
  const workplaceRisksRepository = new PrismaWorkplaceRisksRepository();
  return new DeleteWorkplaceRiskUseCase(workplaceRisksRepository);
}
