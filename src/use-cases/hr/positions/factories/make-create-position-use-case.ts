import { PrismaDepartmentsRepository } from '@/repositories/hr/prisma/prisma-departments-repository';
import { PrismaPositionsRepository } from '@/repositories/hr/prisma/prisma-positions-repository';
import { CreatePositionUseCase } from '../create-position';

export function makeCreatePositionUseCase(): CreatePositionUseCase {
  const positionsRepository = new PrismaPositionsRepository();
  const departmentsRepository = new PrismaDepartmentsRepository();
  const useCase = new CreatePositionUseCase(
    positionsRepository,
    departmentsRepository,
  );

  return useCase;
}
