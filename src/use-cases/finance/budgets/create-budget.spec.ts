import { InMemoryFinanceBudgetsRepository } from '@/repositories/finance/in-memory/in-memory-finance-budgets-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateBudgetUseCase } from './create-budget';

let financeBudgetsRepository: InMemoryFinanceBudgetsRepository;
let sut: CreateBudgetUseCase;

describe('CreateBudgetUseCase', () => {
  beforeEach(() => {
    financeBudgetsRepository = new InMemoryFinanceBudgetsRepository();
    sut = new CreateBudgetUseCase(financeBudgetsRepository);
  });

  it('should create a budget for a category and month', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      categoryId: 'cat-1',
      year: 2026,
      month: 3,
      budgetAmount: 5000,
    });

    expect(result.budget.id).toBeDefined();
    expect(result.budget.budgetAmount).toBe(5000);
    expect(result.budget.year).toBe(2026);
    expect(result.budget.month).toBe(3);
    expect(financeBudgetsRepository.items).toHaveLength(1);
  });

  it('should create a budget with cost center and notes', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      categoryId: 'cat-1',
      costCenterId: 'cc-1',
      year: 2026,
      month: 6,
      budgetAmount: 10000,
      notes: 'Budget for marketing',
    });

    expect(result.budget.costCenterId).toBe('cc-1');
    expect(result.budget.notes).toBe('Budget for marketing');
  });

  it('should reject negative budget amount', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        categoryId: 'cat-1',
        year: 2026,
        month: 3,
        budgetAmount: -100,
      }),
    ).rejects.toThrow('Budget amount must be positive');
  });

  it('should reject invalid month', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        categoryId: 'cat-1',
        year: 2026,
        month: 13,
        budgetAmount: 5000,
      }),
    ).rejects.toThrow('Month must be between 1 and 12');
  });

  it('should reject invalid year', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        categoryId: 'cat-1',
        year: 1999,
        month: 3,
        budgetAmount: 5000,
      }),
    ).rejects.toThrow('Year must be between 2000 and 2100');
  });

  it('should upsert (update) existing budget for same category+month', async () => {
    await sut.execute({
      tenantId: 'tenant-1',
      categoryId: 'cat-1',
      year: 2026,
      month: 3,
      budgetAmount: 5000,
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      categoryId: 'cat-1',
      year: 2026,
      month: 3,
      budgetAmount: 7000,
    });

    expect(result.budget.budgetAmount).toBe(7000);
    expect(financeBudgetsRepository.items).toHaveLength(1);
  });
});
