import { PrismaWorkplaceRisksRepository } from '@/repositories/hr/prisma/prisma-workplace-risks-repository';
import { ListWorkplaceRisksUseCase } from '../list-workplace-risks';

export function makeListWorkplaceRisksUseCase() {
  const workplaceRisksRepository = new PrismaWorkplaceRisksRepository();
  return new ListWorkplaceRisksUseCase(workplaceRisksRepository);
}
