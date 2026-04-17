import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
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
let sut: AcceptReconciliationSuggestionUseCase;

describe('AcceptReconciliationSuggestionUseCase', () => {
  beforeEach(() => {
    suggestionsRepository = new InMemoryReconciliationSuggestionsRepository();
    reconciliationsRepository = new InMemoryBankReconciliationsRepository();
    entriesRepository = new InMemoryFinanceEntriesRepository();
    paymentsRepository = new InMemoryFinanceEntryPaymentsRepository();
    sut = new AcceptReconciliationSuggestionUseCase(
      suggestionsRepository,
      reconciliationsRepository,
      entriesRepository,
      paymentsRepository,
    );
  });

  it('should accept a pending suggestion', async () => {
    // Create a finance entry
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'CP-001',
      description: 'Pagamento fornecedor',
      categoryId: 'cat-1',
      expectedAmount: 1500,
      dueDate: new Date('2026-01-15'),
      issueDate: new Date('2026-01-01'),
    });

    // Seed a reconciliation + item so the tenant guard on updateItem passes
    const reconciliation = await reconciliationsRepository.create({
      tenantId: 'tenant-1',
      bankAccountId: 'bank-1',
      fileName: 'extract.ofx',
      periodStart: new Date('2026-01-01'),
      periodEnd: new Date('2026-01-31'),
      totalTransactions: 1,
    });

    const [item] = await reconciliationsRepository.createItems([
      {
        reconciliationId: reconciliation.id.toString(),
        fitId: 'FIT-1',
        transactionDate: new Date('2026-01-15'),
        amount: 1500,
        description: 'Pagamento fornecedor',
        type: 'DEBIT',
      },
    ]);

    // Create a suggestion pointing to that item
    const suggestion = await suggestionsRepository.create({
      tenantId: 'tenant-1',
      transactionId: item.id.toString(),
      entryId: entry.id.toString(),
      score: 85,
      matchReasons: ['AMOUNT_EXACT', 'DATE_WITHIN_1_DAY'],
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      suggestionId: suggestion.id.toString(),
      userId: 'user-1',
    });

    expect(result.suggestion.status).toBe('ACCEPTED');
    expect(result.suggestion.reviewedBy).toBe('user-1');
    expect(result.suggestion.reviewedAt).toBeDefined();
  });

  it('should refuse to accept a suggestion from another tenant (P2-07)', async () => {
    const entry = await entriesRepository.create({
      tenantId: 'tenant-B',
      type: 'PAYABLE',
      code: 'CP-002',
      description: 'Pagamento fornecedor',
      categoryId: 'cat-1',
      expectedAmount: 500,
      dueDate: new Date('2026-01-15'),
      issueDate: new Date('2026-01-01'),
    });

    // Suggestion belongs to tenant-B
    const suggestion = await suggestionsRepository.create({
      tenantId: 'tenant-B',
      transactionId: 'tx-foreign',
      entryId: entry.id.toString(),
      score: 85,
      matchReasons: ['AMOUNT_EXACT'],
    });

    // Caller is tenant-A — the repo-level findById already scopes by tenant,
    // so the guard surfaces as the generic "not found" error.
    await expect(
      sut.execute({
        tenantId: 'tenant-A',
        suggestionId: suggestion.id.toString(),
        userId: 'user-A',
      }),
    ).rejects.toThrow('Reconciliation suggestion not found');
  });

  it('should throw when suggestion not found', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        suggestionId: new UniqueEntityID().toString(),
        userId: 'user-1',
      }),
    ).rejects.toThrow('Reconciliation suggestion not found');
  });

  it('should throw when suggestion already reviewed', async () => {
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'CP-001',
      description: 'Pagamento fornecedor',
      categoryId: 'cat-1',
      expectedAmount: 1000,
      dueDate: new Date('2026-01-15'),
      issueDate: new Date('2026-01-01'),
    });

    const suggestion = await suggestionsRepository.create({
      tenantId: 'tenant-1',
      transactionId: 'tx-1',
      entryId: entry.id.toString(),
      score: 85,
      matchReasons: ['AMOUNT_EXACT'],
      status: 'ACCEPTED',
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        suggestionId: suggestion.id.toString(),
        userId: 'user-1',
      }),
    ).rejects.toThrow('Suggestion has already been reviewed');
  });
});
