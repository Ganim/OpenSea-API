import { PrismaPositionsRepository } from '@/repositories/hr/prisma/prisma-positions-repository';
import { GetPositionByIdUseCase } from '../get-position-by-id';

export function makeGetPositionByIdUseCase(): GetPositionByIdUseCase {
  const positionsRepository = new PrismaPositionsRepository();
  const useCase = new GetPositionByIdUseCase(positionsRepository);

  return useCase;
}
