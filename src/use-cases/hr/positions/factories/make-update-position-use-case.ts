import { PrismaDepartmentsRepository } from '@/repositories/hr/prisma/prisma-departments-repository';
import { PrismaPositionsRepository } from '@/repositories/hr/prisma/prisma-positions-repository';
import { UpdatePositionUseCase } from '../update-position';

export function makeUpdatePositionUseCase(): UpdatePositionUseCase {
  const positionsRepository = new PrismaPositionsRepository();
  const departmentsRepository = new PrismaDepartmentsRepository();
  const useCase = new UpdatePositionUseCase(
    positionsRepository,
    departmentsRepository,
  );

  return useCase;
}
