import { InMemoryFinanceBudgetsRepository } from '@/repositories/finance/in-memory/in-memory-finance-budgets-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListBudgetsUseCase } from './list-budgets';

let financeBudgetsRepository: InMemoryFinanceBudgetsRepository;
let sut: ListBudgetsUseCase;

describe('ListBudgetsUseCase', () => {
  beforeEach(() => {
    financeBudgetsRepository = new InMemoryFinanceBudgetsRepository();
    sut = new ListBudgetsUseCase(financeBudgetsRepository);
  });

  it('should list budgets for a tenant', async () => {
    await financeBudgetsRepository.create({
      tenantId: 'tenant-1',
      categoryId: 'cat-1',
      year: 2026,
      month: 1,
      budgetAmount: 5000,
    });
    await financeBudgetsRepository.create({
      tenantId: 'tenant-1',
      categoryId: 'cat-1',
      year: 2026,
      month: 2,
      budgetAmount: 6000,
    });

    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.budgets).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it('should filter by year', async () => {
    await financeBudgetsRepository.create({
      tenantId: 'tenant-1',
      categoryId: 'cat-1',
      year: 2026,
      month: 1,
      budgetAmount: 5000,
    });
    await financeBudgetsRepository.create({
      tenantId: 'tenant-1',
      categoryId: 'cat-1',
      year: 2025,
      month: 1,
      budgetAmount: 4000,
    });

    const result = await sut.execute({ tenantId: 'tenant-1', year: 2026 });

    expect(result.budgets).toHaveLength(1);
    expect(result.budgets[0].year).toBe(2026);
  });

  it('should filter by categoryId', async () => {
    await financeBudgetsRepository.create({
      tenantId: 'tenant-1',
      categoryId: 'cat-1',
      year: 2026,
      month: 1,
      budgetAmount: 5000,
    });
    await financeBudgetsRepository.create({
      tenantId: 'tenant-1',
      categoryId: 'cat-2',
      year: 2026,
      month: 1,
      budgetAmount: 3000,
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      categoryId: 'cat-1',
    });

    expect(result.budgets).toHaveLength(1);
    expect(result.budgets[0].categoryId).toBe('cat-1');
  });

  it('should paginate results', async () => {
    for (let i = 1; i <= 5; i++) {
      await financeBudgetsRepository.create({
        tenantId: 'tenant-1',
        categoryId: `cat-${i}`,
        year: 2026,
        month: i,
        budgetAmount: i * 1000,
      });
    }

    const result = await sut.execute({
      tenantId: 'tenant-1',
      page: 1,
      limit: 2,
    });

    expect(result.budgets).toHaveLength(2);
    expect(result.total).toBe(5);
  });
});
