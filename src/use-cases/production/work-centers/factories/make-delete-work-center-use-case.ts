import { PrismaWorkCentersRepository } from '@/repositories/production/prisma/prisma-work-centers-repository';
import { DeleteWorkCenterUseCase } from '../delete-work-center';

export function makeDeleteWorkCenterUseCase() {
  const workCentersRepository = new PrismaWorkCentersRepository();
  const deleteWorkCenterUseCase = new DeleteWorkCenterUseCase(
    workCentersRepository,
  );
  return deleteWorkCenterUseCase;
}
