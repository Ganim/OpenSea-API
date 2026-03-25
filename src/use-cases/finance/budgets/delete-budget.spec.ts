import { InMemoryFinanceBudgetsRepository } from '@/repositories/finance/in-memory/in-memory-finance-budgets-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeleteBudgetUseCase } from './delete-budget';

let financeBudgetsRepository: InMemoryFinanceBudgetsRepository;
let sut: DeleteBudgetUseCase;

describe('DeleteBudgetUseCase', () => {
  beforeEach(() => {
    financeBudgetsRepository = new InMemoryFinanceBudgetsRepository();
    sut = new DeleteBudgetUseCase(financeBudgetsRepository);
  });

  it('should delete an existing budget', async () => {
    const created = await financeBudgetsRepository.create({
      tenantId: 'tenant-1',
      categoryId: 'cat-1',
      year: 2026,
      month: 3,
      budgetAmount: 5000,
    });

    await sut.execute({
      id: created.id.toString(),
      tenantId: 'tenant-1',
    });

    expect(financeBudgetsRepository.items).toHaveLength(0);
  });

  it('should throw on non-existent budget', async () => {
    await expect(
      sut.execute({
        id: 'non-existent',
        tenantId: 'tenant-1',
      }),
    ).rejects.toThrow('Budget');
  });
});
