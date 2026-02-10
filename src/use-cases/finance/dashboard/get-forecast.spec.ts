import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetForecastUseCase } from './get-forecast';

let entriesRepository: InMemoryFinanceEntriesRepository;
let sut: GetForecastUseCase;

describe('GetForecastUseCase', () => {
  beforeEach(async () => {
    entriesRepository = new InMemoryFinanceEntriesRepository();
    sut = new GetForecastUseCase(entriesRepository);
  });

  it('should return empty forecast when no entries', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-03-31'),
      groupBy: 'month',
    });

    expect(result.data).toHaveLength(0);
    expect(result.totals.totalPayable).toBe(0);
    expect(result.totals.totalReceivable).toBe(0);
    expect(result.totals.netBalance).toBe(0);
  });

  it('should forecast payable and receivable by month for 3 months', async () => {
    // Jan: 5000 payable, 8000 receivable
    await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Rent Jan',
      categoryId: 'cat-1',
      costCenterId: 'cc-1',
      expectedAmount: 5000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-01-15'),
    });

    await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'RECEIVABLE',
      code: 'REC-001',
      description: 'Sale Jan',
      categoryId: 'cat-1',
      costCenterId: 'cc-1',
      expectedAmount: 8000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-01-20'),
    });

    // Feb: 3000 payable
    await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-002',
      description: 'Utilities Feb',
      categoryId: 'cat-1',
      costCenterId: 'cc-1',
      expectedAmount: 3000,
      issueDate: new Date('2026-02-01'),
      dueDate: new Date('2026-02-10'),
    });

    // Mar: 12000 receivable
    await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'RECEIVABLE',
      code: 'REC-002',
      description: 'Big sale Mar',
      categoryId: 'cat-1',
      costCenterId: 'cc-1',
      expectedAmount: 12000,
      issueDate: new Date('2026-03-01'),
      dueDate: new Date('2026-03-15'),
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-03-31'),
      groupBy: 'month',
    });

    expect(result.data).toHaveLength(3);

    // Jan: payable 5000, receivable 8000, net +3000, cumulative +3000
    expect(result.data[0].date).toBe('2026-01-01');
    expect(result.data[0].payable).toBe(5000);
    expect(result.data[0].receivable).toBe(8000);
    expect(result.data[0].net).toBe(3000);
    expect(result.data[0].cumulativeNet).toBe(3000);

    // Feb: payable 3000, receivable 0, net -3000, cumulative 0
    expect(result.data[1].date).toBe('2026-02-01');
    expect(result.data[1].payable).toBe(3000);
    expect(result.data[1].receivable).toBe(0);
    expect(result.data[1].net).toBe(-3000);
    expect(result.data[1].cumulativeNet).toBe(0);

    // Mar: payable 0, receivable 12000, net +12000, cumulative +12000
    expect(result.data[2].date).toBe('2026-03-01');
    expect(result.data[2].receivable).toBe(12000);
    expect(result.data[2].cumulativeNet).toBe(12000);

    expect(result.totals.totalPayable).toBe(8000);
    expect(result.totals.totalReceivable).toBe(20000);
    expect(result.totals.netBalance).toBe(12000);
  });

  it('should filter by type when specified', async () => {
    await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Expense',
      categoryId: 'cat-1',
      costCenterId: 'cc-1',
      expectedAmount: 5000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-01-15'),
    });

    await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'RECEIVABLE',
      code: 'REC-001',
      description: 'Income',
      categoryId: 'cat-1',
      costCenterId: 'cc-1',
      expectedAmount: 8000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-01-20'),
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-01-31'),
      groupBy: 'month',
    });

    // Only payable should be returned, receivable should be 0
    expect(result.data).toHaveLength(1);
    expect(result.data[0].payable).toBe(5000);
    expect(result.data[0].receivable).toBe(0);
    expect(result.totals.totalPayable).toBe(5000);
    expect(result.totals.totalReceivable).toBe(0);
  });

  it('should return breakdown by category and cost center', async () => {
    entriesRepository.categoryNames.set('cat-1', 'Fornecedores');
    entriesRepository.categoryNames.set('cat-2', 'Servicos');
    entriesRepository.costCenterNames.set('cc-1', 'Administrativo');

    await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'P1',
      categoryId: 'cat-1',
      costCenterId: 'cc-1',
      expectedAmount: 5000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-01-15'),
    });

    await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-002',
      description: 'P2',
      categoryId: 'cat-2',
      costCenterId: 'cc-1',
      expectedAmount: 3000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-01-20'),
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-01-31'),
      groupBy: 'month',
    });

    expect(result.byCategory).toHaveLength(2);
    expect(result.byCategory[0].categoryName).toBe('Fornecedores');
    expect(result.byCategory[0].total).toBe(5000);
    expect(result.byCategory[1].categoryName).toBe('Servicos');
    expect(result.byCategory[1].total).toBe(3000);

    expect(result.byCostCenter).toHaveLength(1);
    expect(result.byCostCenter[0].costCenterName).toBe('Administrativo');
    expect(result.byCostCenter[0].total).toBe(8000);
  });
});
