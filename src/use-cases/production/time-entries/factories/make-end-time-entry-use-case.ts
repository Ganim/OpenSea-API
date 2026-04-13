import { PrismaTimeEntriesRepository } from '@/repositories/production/prisma/prisma-time-entries-repository';
import { EndTimeEntryUseCase } from '../end-time-entry';

export function makeEndTimeEntryUseCase() {
  const timeEntriesRepository = new PrismaTimeEntriesRepository();
  const endTimeEntryUseCase = new EndTimeEntryUseCase(timeEntriesRepository);
  return endTimeEntryUseCase;
}
