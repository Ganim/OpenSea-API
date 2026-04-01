import { PrismaJournalEntriesRepository } from '@/repositories/finance/prisma/prisma-journal-entries-repository';
import { ListJournalEntriesUseCase } from '../list-journal-entries';

export function makeListJournalEntriesUseCase() {
  const repository = new PrismaJournalEntriesRepository();
  return new ListJournalEntriesUseCase(repository);
}
