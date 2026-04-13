import { PrismaTimeEntriesRepository } from '@/repositories/production/prisma/prisma-time-entries-repository';
import { ListTimeEntriesUseCase } from '../list-time-entries';

export function makeListTimeEntriesUseCase() {
  const timeEntriesRepository = new PrismaTimeEntriesRepository();
  const listTimeEntriesUseCase = new ListTimeEntriesUseCase(
    timeEntriesRepository,
  );
  return listTimeEntriesUseCase;
}
