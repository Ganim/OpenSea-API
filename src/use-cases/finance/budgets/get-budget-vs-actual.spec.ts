import { InMemoryFinanceBudgetsRepository } from '@/repositories/finance/in-memory/in-memory-finance-budgets-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetBudgetVsActualUseCase } from './get-budget-vs-actual';

let financeBudgetsRepository: InMemoryFinanceBudgetsRepository;
let sut: GetBudgetVsActualUseCase;

describe('GetBudgetVsActualUseCase', () => {
  beforeEach(() => {
    financeBudgetsRepository = new InMemoryFinanceBudgetsRepository();
    sut = new GetBudgetVsActualUseCase(financeBudgetsRepository);
  });

  it('should return budget vs actual rows', async () => {
    await financeBudgetsRepository.create({
      tenantId: 'tenant-1',
      categoryId: 'cat-1',
      year: 2026,
      month: 3,
      budgetAmount: 5000,
    });
    await financeBudgetsRepository.create({
      tenantId: 'tenant-1',
      categoryId: 'cat-2',
      year: 2026,
      month: 3,
      budgetAmount: 3000,
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      year: 2026,
      month: 3,
    });

    expect(result.rows).toHaveLength(2);
    expect(result.totals.totalBudget).toBe(8000);
    expect(result.totals).toHaveProperty('overallStatus');
  });

  it('should calculate totals correctly', async () => {
    await financeBudgetsRepository.create({
      tenantId: 'tenant-1',
      categoryId: 'cat-1',
      year: 2026,
      month: 3,
      budgetAmount: 10000,
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      year: 2026,
      month: 3,
    });

    // In-memory returns actualAmount = 0, so variance = -10000
    expect(result.totals.totalBudget).toBe(10000);
    expect(result.totals.totalActual).toBe(0);
    expect(result.totals.totalVariance).toBe(-10000);
    expect(result.totals.overallStatus).toBe('UNDER_BUDGET');
  });

  it('should reject invalid month', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        year: 2026,
        month: 0,
      }),
    ).rejects.toThrow('Month must be between 1 and 12');
  });

  it('should reject invalid year', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        year: 1999,
        month: 3,
      }),
    ).rejects.toThrow('Year must be between 2000 and 2100');
  });

  it('should return empty rows when no budgets exist', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      year: 2026,
      month: 3,
    });

    expect(result.rows).toHaveLength(0);
    expect(result.totals.totalBudget).toBe(0);
  });
});
