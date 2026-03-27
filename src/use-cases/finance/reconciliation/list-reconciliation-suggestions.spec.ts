import { InMemoryReconciliationSuggestionsRepository } from '@/repositories/finance/in-memory/in-memory-reconciliation-suggestions-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListReconciliationSuggestionsUseCase } from './list-reconciliation-suggestions';

let suggestionsRepository: InMemoryReconciliationSuggestionsRepository;
let sut: ListReconciliationSuggestionsUseCase;

describe('ListReconciliationSuggestionsUseCase', () => {
  beforeEach(() => {
    suggestionsRepository = new InMemoryReconciliationSuggestionsRepository();
    sut = new ListReconciliationSuggestionsUseCase(suggestionsRepository);
  });

  it('should list suggestions for a tenant', async () => {
    await suggestionsRepository.create({
      tenantId: 'tenant-1',
      transactionId: 'tx-1',
      entryId: 'entry-1',
      score: 85,
      matchReasons: ['AMOUNT_EXACT', 'DATE_WITHIN_1_DAY'],
    });

    await suggestionsRepository.create({
      tenantId: 'tenant-1',
      transactionId: 'tx-2',
      entryId: 'entry-2',
      score: 75,
      matchReasons: ['AMOUNT_EXACT'],
    });

    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.suggestions).toHaveLength(2);
    expect(result.meta.total).toBe(2);
  });

  it('should filter by status', async () => {
    await suggestionsRepository.create({
      tenantId: 'tenant-1',
      transactionId: 'tx-1',
      entryId: 'entry-1',
      score: 85,
      matchReasons: ['AMOUNT_EXACT'],
    });

    const accepted = await suggestionsRepository.create({
      tenantId: 'tenant-1',
      transactionId: 'tx-2',
      entryId: 'entry-2',
      score: 90,
      matchReasons: ['AMOUNT_EXACT', 'DATE_WITHIN_1_DAY'],
      status: 'ACCEPTED',
    });

    const pendingResult = await sut.execute({
      tenantId: 'tenant-1',
      status: 'PENDING',
    });

    expect(pendingResult.suggestions).toHaveLength(1);
    expect(pendingResult.suggestions[0].status).toBe('PENDING');

    const acceptedResult = await sut.execute({
      tenantId: 'tenant-1',
      status: 'ACCEPTED',
    });

    expect(acceptedResult.suggestions).toHaveLength(1);
    expect(acceptedResult.suggestions[0].id).toBe(accepted.id.toString());
  });

  it('should return empty list for tenant with no suggestions', async () => {
    const result = await sut.execute({ tenantId: 'tenant-empty' });

    expect(result.suggestions).toHaveLength(0);
    expect(result.meta.total).toBe(0);
  });

  it('should paginate results', async () => {
    for (let i = 0; i < 5; i++) {
      await suggestionsRepository.create({
        tenantId: 'tenant-1',
        transactionId: `tx-${i}`,
        entryId: `entry-${i}`,
        score: 70 + i,
        matchReasons: ['AMOUNT_EXACT'],
      });
    }

    const result = await sut.execute({
      tenantId: 'tenant-1',
      page: 1,
      limit: 2,
    });

    expect(result.suggestions).toHaveLength(2);
    expect(result.meta.total).toBe(5);
    expect(result.meta.pages).toBe(3);
  });
});
