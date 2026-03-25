import { InMemoryFinanceBudgetsRepository } from '@/repositories/finance/in-memory/in-memory-finance-budgets-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { BulkCreateBudgetsUseCase } from './bulk-create-budgets';

let financeBudgetsRepository: InMemoryFinanceBudgetsRepository;
let sut: BulkCreateBudgetsUseCase;

describe('BulkCreateBudgetsUseCase', () => {
  beforeEach(() => {
    financeBudgetsRepository = new InMemoryFinanceBudgetsRepository();
    sut = new BulkCreateBudgetsUseCase(financeBudgetsRepository);
  });

  it('should create budgets for multiple months', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      categoryId: 'cat-1',
      year: 2026,
      monthlyBudgets: [
        { month: 1, budgetAmount: 5000 },
        { month: 2, budgetAmount: 5200 },
        { month: 3, budgetAmount: 5400 },
      ],
    });

    expect(result.createdCount).toBe(3);
    expect(result.budgets).toHaveLength(3);
    expect(financeBudgetsRepository.items).toHaveLength(3);
  });

  it('should create all 12 months at once', async () => {
    const monthlyBudgets = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      budgetAmount: 5000 + i * 100,
    }));

    const result = await sut.execute({
      tenantId: 'tenant-1',
      categoryId: 'cat-1',
      year: 2026,
      monthlyBudgets,
    });

    expect(result.createdCount).toBe(12);
    expect(financeBudgetsRepository.items).toHaveLength(12);
  });

  it('should reject empty monthly budgets', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        categoryId: 'cat-1',
        year: 2026,
        monthlyBudgets: [],
      }),
    ).rejects.toThrow('At least one monthly budget is required');
  });

  it('should reject invalid month', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        categoryId: 'cat-1',
        year: 2026,
        monthlyBudgets: [{ month: 0, budgetAmount: 5000 }],
      }),
    ).rejects.toThrow('Invalid month');
  });

  it('should reject duplicate months', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        categoryId: 'cat-1',
        year: 2026,
        monthlyBudgets: [
          { month: 1, budgetAmount: 5000 },
          { month: 1, budgetAmount: 6000 },
        ],
      }),
    ).rejects.toThrow('Duplicate months');
  });

  it('should reject negative budget amount', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        categoryId: 'cat-1',
        year: 2026,
        monthlyBudgets: [{ month: 1, budgetAmount: -100 }],
      }),
    ).rejects.toThrow('must be positive');
  });
});
