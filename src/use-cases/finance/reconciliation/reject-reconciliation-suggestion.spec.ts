import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryReconciliationSuggestionsRepository } from '@/repositories/finance/in-memory/in-memory-reconciliation-suggestions-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { RejectReconciliationSuggestionUseCase } from './reject-reconciliation-suggestion';

let suggestionsRepository: InMemoryReconciliationSuggestionsRepository;
let sut: RejectReconciliationSuggestionUseCase;

describe('RejectReconciliationSuggestionUseCase', () => {
  beforeEach(() => {
    suggestionsRepository = new InMemoryReconciliationSuggestionsRepository();
    sut = new RejectReconciliationSuggestionUseCase(suggestionsRepository);
  });

  it('should reject a pending suggestion', async () => {
    const suggestion = await suggestionsRepository.create({
      tenantId: 'tenant-1',
      transactionId: 'tx-1',
      entryId: 'entry-1',
      score: 75,
      matchReasons: ['AMOUNT_EXACT'],
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      suggestionId: suggestion.id.toString(),
      userId: 'user-1',
    });

    expect(result.suggestion.status).toBe('REJECTED');
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
    const suggestion = await suggestionsRepository.create({
      tenantId: 'tenant-1',
      transactionId: 'tx-1',
      entryId: 'entry-1',
      score: 85,
      matchReasons: ['AMOUNT_EXACT'],
      status: 'REJECTED',
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
