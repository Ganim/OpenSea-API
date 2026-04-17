import { PrismaTransactionManager } from '@/lib/transaction-manager';
import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { PrismaJournalEntriesRepository } from '@/repositories/finance/prisma/prisma-journal-entries-repository';
import { ReverseJournalEntryUseCase } from '@/use-cases/finance/journal-entries/reverse-journal-entry';
import { CancelFinanceEntryUseCase } from '../cancel-finance-entry';

export function makeCancelFinanceEntryUseCase() {
  const entriesRepository = new PrismaFinanceEntriesRepository();
  const journalEntriesRepository = new PrismaJournalEntriesRepository();
  const reverseJournalEntry = new ReverseJournalEntryUseCase(
    journalEntriesRepository,
  );
  const transactionManager = new PrismaTransactionManager();

  return new CancelFinanceEntryUseCase(
    entriesRepository,
    journalEntriesRepository,
    reverseJournalEntry,
    transactionManager,
  );
}
