import { PrismaWorkCentersRepository } from '@/repositories/production/prisma/prisma-work-centers-repository';
import { ListWorkCentersUseCase } from '../list-work-centers';

export function makeListWorkCentersUseCase() {
  const workCentersRepository = new PrismaWorkCentersRepository();
  const listWorkCentersUseCase = new ListWorkCentersUseCase(
    workCentersRepository,
  );
  return listWorkCentersUseCase;
}
