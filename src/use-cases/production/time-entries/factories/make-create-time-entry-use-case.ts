import { PrismaTimeEntriesRepository } from '@/repositories/production/prisma/prisma-time-entries-repository';
import { CreateTimeEntryUseCase } from '../create-time-entry';

export function makeCreateTimeEntryUseCase() {
  const timeEntriesRepository = new PrismaTimeEntriesRepository();
  const createTimeEntryUseCase = new CreateTimeEntryUseCase(
    timeEntriesRepository,
  );
  return createTimeEntryUseCase;
}
