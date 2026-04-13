import { PrismaJobCardsRepository } from '@/repositories/production/prisma/prisma-job-cards-repository';
import { PrismaTimeEntriesRepository } from '@/repositories/production/prisma/prisma-time-entries-repository';
import { CreateTimeEntryUseCase } from '../create-time-entry';

export function makeCreateTimeEntryUseCase() {
  const timeEntriesRepository = new PrismaTimeEntriesRepository();
  const jobCardsRepository = new PrismaJobCardsRepository();
  const createTimeEntryUseCase = new CreateTimeEntryUseCase(
    timeEntriesRepository,
    jobCardsRepository,
  );
  return createTimeEntryUseCase;
}
