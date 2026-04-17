import { InMemoryTransactionManager } from '@/lib/in-memory-transaction-manager';
import { InMemoryBankReconciliationsRepository } from '@/repositories/finance/in-memory/in-memory-bank-reconciliations-repository';
import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import { InMemoryFinanceEntryPaymentsRepository } from '@/repositories/finance/in-memory/in-memory-finance-entry-payments-repository';
import { InMemoryReconciliationSuggestionsRepository } from '@/repositories/finance/in-memory/in-memory-reconciliation-suggestions-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { AcceptReconciliationSuggestionUseCase } from './accept-reconciliation-suggestion';

let suggestionsRepository: InMemoryReconciliationSuggestionsRepository;
let reconciliationsRepository: InMemoryBankReconciliationsRepository;
let entriesRepository: InMemoryFinanceEntriesRepository;
let paymentsRepository: InMemoryFinanceEntryPaymentsRepository;
let transactionManager: InMemoryTransactionManager;
let sut: AcceptReconciliationSuggestionUseCase;

describe('AcceptReconciliationSuggestionUseCase — concurrency', () => {
  beforeEach(() => {
    suggestionsRepository = new InMemoryReconciliationSuggestionsRepository();
    reconciliationsRepository = new InMemoryBankReconciliationsRepository();
    entriesRepository = new InMemoryFinanceEntriesRepository();
    paymentsRepository = new InMemoryFinanceEntryPaymentsRepository();
    transactionManager = new InMemoryTransactionManager();
    sut = new AcceptReconciliationSuggestionUseCase(
      suggestionsRepository,
      reconciliationsRepository,
      entriesRepository,
      paymentsRepository,
      transactionManager,
    );
  });

  it('should not double-pay when two suggestions for the same entry are accepted concurrently', async () => {
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'CP-001',
      description: 'Pagamento fornecedor',
      categoryId: 'cat-1',
      expectedAmount: 500,
      dueDate: new Date('2026-01-15'),
      issueDate: new Date('2026-01-01'),
    });

    // Parent reconciliation item required by updateItem tenant guard
    const recon = await reconciliationsRepository.create({
      tenantId: 'tenant-1',
      bankAccountId: 'bank-1',
      fileName: 'sample.ofx',
      periodStart: new Date('2026-01-01'),
      periodEnd: new Date('2026-01-31'),
      totalTransactions: 2,
    });
    await reconciliationsRepository.createItems([
      {
        reconciliationId: recon.id.toString(),
        fitId: 'tx-1',
        transactionDate: new Date('2026-01-10'),
        amount: 500,
        description: 'Boleto',
        type: 'DEBIT',
      },
      {
        reconciliationId: recon.id.toString(),
        fitId: 'tx-2',
        transactionDate: new Date('2026-01-10'),
        amount: 500,
        description: 'Boleto',
        type: 'DEBIT',
      },
    ]);
    const [item1, item2] = reconciliationsRepository.items;

    const s1 = await suggestionsRepository.create({
      tenantId: 'tenant-1',
      transactionId: item1.id.toString(),
      entryId: entry.id.toString(),
      score: 100,
      matchReasons: ['AMOUNT_EXACT'],
    });

    const s2 = await suggestionsRepository.create({
      tenantId: 'tenant-1',
      transactionId: item2.id.toString(),
      entryId: entry.id.toString(),
      score: 100,
      matchReasons: ['AMOUNT_EXACT'],
    });

    await Promise.allSettled([
      sut.execute({
        tenantId: 'tenant-1',
        suggestionId: s1.id.toString(),
        userId: 'user-1',
      }),
      sut.execute({
        tenantId: 'tenant-1',
        suggestionId: s2.id.toString(),
        userId: 'user-1',
      }),
    ]);

    // Total paid must not exceed totalDue even when both suggestions
    // were accepted against the same entry — the second one finds no
    // remaining balance and creates no payment.
    const totalPaid = await paymentsRepository.sumByEntryId(entry.id);
    expect(totalPaid).toBe(500);

    const updated = await entriesRepository.findById(entry.id, 'tenant-1');
    expect(updated?.status).toBe('PAID');
  });
});
