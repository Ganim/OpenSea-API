import { PrismaJournalEntriesRepository } from '@/repositories/finance/prisma/prisma-journal-entries-repository';
import { CreateJournalEntryUseCase } from '../create-journal-entry';

export function makeCreateJournalEntryUseCase() {
  const repository = new PrismaJournalEntriesRepository();
  return new CreateJournalEntryUseCase(repository);
}
