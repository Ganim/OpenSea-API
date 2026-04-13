import { PrismaWorkCentersRepository } from '@/repositories/production/prisma/prisma-work-centers-repository';
import { CreateWorkCenterUseCase } from '../create-work-center';

export function makeCreateWorkCenterUseCase() {
  const workCentersRepository = new PrismaWorkCentersRepository();
  const createWorkCenterUseCase = new CreateWorkCenterUseCase(
    workCentersRepository,
  );
  return createWorkCenterUseCase;
}
