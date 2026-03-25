import { InMemoryFinanceBudgetsRepository } from '@/repositories/finance/in-memory/in-memory-finance-budgets-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateBudgetUseCase } from './update-budget';

let financeBudgetsRepository: InMemoryFinanceBudgetsRepository;
let sut: UpdateBudgetUseCase;

describe('UpdateBudgetUseCase', () => {
  beforeEach(() => {
    financeBudgetsRepository = new InMemoryFinanceBudgetsRepository();
    sut = new UpdateBudgetUseCase(financeBudgetsRepository);
  });

  it('should update budget amount', async () => {
    const created = await financeBudgetsRepository.create({
      tenantId: 'tenant-1',
      categoryId: 'cat-1',
      year: 2026,
      month: 3,
      budgetAmount: 5000,
    });

    const result = await sut.execute({
      id: created.id.toString(),
      tenantId: 'tenant-1',
      budgetAmount: 7500,
    });

    expect(result.budget.budgetAmount).toBe(7500);
  });

  it('should update notes', async () => {
    const created = await financeBudgetsRepository.create({
      tenantId: 'tenant-1',
      categoryId: 'cat-1',
      year: 2026,
      month: 3,
      budgetAmount: 5000,
    });

    const result = await sut.execute({
      id: created.id.toString(),
      tenantId: 'tenant-1',
      notes: 'Updated notes',
    });

    expect(result.budget.notes).toBe('Updated notes');
  });

  it('should throw on non-existent budget', async () => {
    await expect(
      sut.execute({
        id: 'non-existent',
        tenantId: 'tenant-1',
        budgetAmount: 5000,
      }),
    ).rejects.toThrow('Budget');
  });

  it('should reject negative budget amount', async () => {
    const created = await financeBudgetsRepository.create({
      tenantId: 'tenant-1',
      categoryId: 'cat-1',
      year: 2026,
      month: 3,
      budgetAmount: 5000,
    });

    await expect(
      sut.execute({
        id: created.id.toString(),
        tenantId: 'tenant-1',
        budgetAmount: -100,
      }),
    ).rejects.toThrow('Budget amount must be positive');
  });
});
