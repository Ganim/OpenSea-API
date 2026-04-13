import { PrismaWorkCentersRepository } from '@/repositories/production/prisma/prisma-work-centers-repository';
import { UpdateWorkCenterUseCase } from '../update-work-center';

export function makeUpdateWorkCenterUseCase() {
  const workCentersRepository = new PrismaWorkCentersRepository();
  const updateWorkCenterUseCase = new UpdateWorkCenterUseCase(
    workCentersRepository,
  );
  return updateWorkCenterUseCase;
}
