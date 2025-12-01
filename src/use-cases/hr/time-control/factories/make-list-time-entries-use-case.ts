import { PrismaTimeEntriesRepository } from '@/repositories/hr/prisma/prisma-time-entries-repository';
import { ListTimeEntriesUseCase } from '../list-time-entries';

export function makeListTimeEntriesUseCase(): ListTimeEntriesUseCase {
  const timeEntriesRepository = new PrismaTimeEntriesRepository();
  const useCase = new ListTimeEntriesUseCase(timeEntriesRepository);

  return useCase;
}
