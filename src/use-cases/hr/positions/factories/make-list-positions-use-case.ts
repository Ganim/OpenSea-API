import { PrismaPositionsRepository } from '@/repositories/hr/prisma/prisma-positions-repository';
import { ListPositionsUseCase } from '../list-positions';

export function makeListPositionsUseCase(): ListPositionsUseCase {
  const positionsRepository = new PrismaPositionsRepository();
  const useCase = new ListPositionsUseCase(positionsRepository);

  return useCase;
}
