import { PrismaPositionsRepository } from '@/repositories/hr/prisma/prisma-positions-repository';
import { DeletePositionUseCase } from '../delete-position';

export function makeDeletePositionUseCase(): DeletePositionUseCase {
  const positionsRepository = new PrismaPositionsRepository();
  const useCase = new DeletePositionUseCase(positionsRepository);

  return useCase;
}
