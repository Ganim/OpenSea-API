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

  // P2-12: zero budget edge cases — divide-by-zero would hide real overruns
  it('should return 0% variance when both budget and actual are zero', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      year: 2026,
      month: 3,
    });

    expect(result.totals.totalBudget).toBe(0);
    expect(result.totals.totalActual).toBe(0);
    expect(result.totals.totalVariancePercent).toBe(0);
    expect(result.totals.overallStatus).toBe('ON_BUDGET');
  });

  it('should return Infinity variance and OVER_BUDGET when budget is zero but actual spend exists', async () => {
    // Simulate actual spend by stubbing the repo method: a row with
    // budgetAmount=0 but actualAmount>0 (the Prisma impl normally computes
    // actualAmount from FinanceEntries, so the use case just reads rows).
    financeBudgetsRepository.getBudgetVsActual = async () => [
      {
        categoryId: 'cat-1',
        categoryName: 'Sem orçamento',
        costCenterId: null,
        costCenterName: null,
        budgetAmount: 0,
        actualAmount: 10000,
        variance: 10000,
        variancePercent: 0,
        status: 'OVER_BUDGET',
      },
    ];

    const result = await sut.execute({
      tenantId: 'tenant-1',
      year: 2026,
      month: 3,
    });

    expect(result.totals.totalBudget).toBe(0);
    expect(result.totals.totalActual).toBe(10000);
    expect(result.totals.totalVariancePercent).toBe(Infinity);
    expect(result.totals.overallStatus).toBe('OVER_BUDGET');
  });
});
