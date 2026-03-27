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

    // Create a suggestion
    const suggestion = await suggestionsRepository.create({
      tenantId: 'tenant-1',
      transactionId: 'tx-1',
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
