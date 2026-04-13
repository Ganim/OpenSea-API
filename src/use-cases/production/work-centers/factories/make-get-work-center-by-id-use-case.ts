import { PrismaWorkCentersRepository } from '@/repositories/production/prisma/prisma-work-centers-repository';
import { GetWorkCenterByIdUseCase } from '../get-work-center-by-id';

export function makeGetWorkCenterByIdUseCase() {
  const workCentersRepository = new PrismaWorkCentersRepository();
  const getWorkCenterByIdUseCase = new GetWorkCenterByIdUseCase(
    workCentersRepository,
  );
  return getWorkCenterByIdUseCase;
}
