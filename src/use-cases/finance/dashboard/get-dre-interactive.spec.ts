import { InMemoryFinanceCategoriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-categories-repository';
import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetInteractiveDREUseCase } from './get-dre-interactive';

let categoriesRepository: InMemoryFinanceCategoriesRepository;
let entriesRepository: InMemoryFinanceEntriesRepository;
let sut: GetInteractiveDREUseCase;

describe('GetInteractiveDREUseCase', () => {
  beforeEach(async () => {
    categoriesRepository = new InMemoryFinanceCategoriesRepository();
    entriesRepository = new InMemoryFinanceEntriesRepository();
    sut = new GetInteractiveDREUseCase(categoriesRepository, entriesRepository);

    // Create category hierarchy
    // Revenue root
    const revRoot = await categoriesRepository.create({
      tenantId: 'tenant-1',
      name: 'Receitas',
      slug: 'receitas',
      type: 'REVENUE',
    });

    const revChild = await categoriesRepository.create({
      tenantId: 'tenant-1',
      name: 'Vendas',
      slug: 'vendas',
      type: 'REVENUE',
      parentId: revRoot.id.toString(),
    });

    // Expense root
    const expRoot = await categoriesRepository.create({
      tenantId: 'tenant-1',
      name: 'Despesas',
      slug: 'despesas',
      type: 'EXPENSE',
    });

    const expChild = await categoriesRepository.create({
      tenantId: 'tenant-1',
      name: 'Aluguel',
      slug: 'aluguel',
      type: 'EXPENSE',
      parentId: expRoot.id.toString(),
    });

    // Create entries for current period (Jan 2026)
    await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'RECEIVABLE',
      code: 'REC-001',
      description: 'Venda 1',
      categoryId: revChild.id.toString(),
      expectedAmount: 5000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-01-15'),
      status: 'PAID',
    });

    await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'RECEIVABLE',
      code: 'REC-002',
      description: 'Venda 2',
      categoryId: revChild.id.toString(),
      expectedAmount: 3000,
      issueDate: new Date('2026-01-10'),
      dueDate: new Date('2026-01-20'),
      status: 'RECEIVED',
    });

    await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Aluguel Jan',
      categoryId: expChild.id.toString(),
      expectedAmount: 2500,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-01-10'),
      status: 'PAID',
    });

    // Create entries for previous period (Dec 2025)
    await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'RECEIVABLE',
      code: 'REC-003',
      description: 'Venda Dez',
      categoryId: revChild.id.toString(),
      expectedAmount: 4000,
      issueDate: new Date('2025-12-01'),
      dueDate: new Date('2025-12-15'),
      status: 'RECEIVED',
    });

    await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-002',
      description: 'Aluguel Dez',
      categoryId: expChild.id.toString(),
      expectedAmount: 2500,
      issueDate: new Date('2025-12-01'),
      dueDate: new Date('2025-12-10'),
      status: 'PAID',
    });
  });

  it('should return hierarchical DRE with revenue and expenses', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-01-31'),
    });

    expect(result.revenue).toBeDefined();
    expect(result.expenses).toBeDefined();
    expect(result.revenue.currentPeriod).toBe(8000);
    expect(result.expenses.currentPeriod).toBe(2500);
    expect(result.netResult).toBe(5500);
  });

  it('should calculate previous period comparison', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-01-31'),
    });

    // Previous period: Dec 2025
    expect(result.revenue.previousPeriod).toBe(4000);
    expect(result.expenses.previousPeriod).toBe(2500);
    expect(result.previousNetResult).toBe(1500);
  });

  it('should calculate variation percentage', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-01-31'),
    });

    // Revenue: (8000-4000)/4000 * 100 = 100%
    expect(result.revenue.variationPercent).toBe(100);
  });

  it('should include children in hierarchy', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-01-31'),
    });

    expect(result.revenue.children.length).toBeGreaterThan(0);
    expect(result.expenses.children.length).toBeGreaterThan(0);
  });

  it('should handle empty data', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-2',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-01-31'),
    });

    expect(result.revenue.currentPeriod).toBe(0);
    expect(result.expenses.currentPeriod).toBe(0);
    expect(result.netResult).toBe(0);
  });

  it('should handle zero previous period (no division by zero)', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-06-30'),
    });

    // No entries in June, both periods zero
    expect(result.revenue.variationPercent).toBe(0);
    expect(result.expenses.variationPercent).toBe(0);
  });

  it('should include period dates in response', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-01-31'),
    });

    expect(result.period.start).toEqual(new Date('2026-01-01'));
    expect(result.period.end).toEqual(new Date('2026-01-31'));
    expect(result.previousPeriod.start).toBeDefined();
    expect(result.previousPeriod.end).toBeDefined();
  });
});
