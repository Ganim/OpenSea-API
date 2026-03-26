import { beforeEach, describe, expect, it } from 'vitest';
import { GetSupplierSummaryUseCase } from './get-supplier-summary';
import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';

describe('GetSupplierSummaryUseCase', () => {
  let sut: GetSupplierSummaryUseCase;
  let financeEntriesRepository: InMemoryFinanceEntriesRepository;

  beforeEach(() => {
    financeEntriesRepository = new InMemoryFinanceEntriesRepository();
    sut = new GetSupplierSummaryUseCase(financeEntriesRepository);
  });

  it('should return empty response when no params provided', async () => {
    const summary = await sut.execute({ tenantId: 'tenant-1' });

    expect(summary.entryCount).toBe(0);
    expect(summary.totalPaid).toBe(0);
    expect(summary.totalPending).toBe(0);
    expect(summary.totalOverdue).toBe(0);
    expect(summary.monthlyTrend).toEqual([]);
    expect(summary.recentEntries).toEqual([]);
  });

  it('should return empty response when no entries match the supplier', async () => {
    const summary = await sut.execute({
      tenantId: 'tenant-1',
      supplierName: 'Fornecedor Inexistente',
    });

    expect(summary.entryCount).toBe(0);
  });

  it('should aggregate totals correctly for a supplier', async () => {
    // PAID entry
    await financeEntriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAY-001',
      description: 'Payment 1',
      categoryId: 'cat-1',
      supplierName: 'Fornecedor A',
      expectedAmount: 1000,
      actualAmount: 1000,
      status: 'PAID',
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-01-15'),
    });

    // PENDING entry (not overdue)
    await financeEntriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAY-002',
      description: 'Payment 2',
      categoryId: 'cat-1',
      supplierName: 'Fornecedor A',
      expectedAmount: 500,
      status: 'PENDING',
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2099-12-31'),
    });

    // OVERDUE entry
    await financeEntriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAY-003',
      description: 'Payment 3',
      categoryId: 'cat-1',
      supplierName: 'Fornecedor A',
      expectedAmount: 300,
      status: 'OVERDUE',
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2025-12-01'),
    });

    const summary = await sut.execute({
      tenantId: 'tenant-1',
      supplierName: 'Fornecedor A',
    });

    expect(summary.entryCount).toBe(3);
    expect(summary.totalPaid).toBe(1000);
    expect(summary.totalPending).toBe(500);
    expect(summary.totalOverdue).toBe(300);
    expect(summary.avgAmount).toBe(600);
  });

  it('should return recent entries (last 5)', async () => {
    for (let i = 1; i <= 7; i++) {
      await financeEntriesRepository.create({
        tenantId: 'tenant-1',
        type: 'PAYABLE',
        code: `PAY-00${i}`,
        description: `Payment ${i}`,
        categoryId: 'cat-1',
        supplierName: 'Fornecedor B',
        expectedAmount: i * 100,
        issueDate: new Date(`2026-0${Math.min(i, 9)}-01`),
        dueDate: new Date(`2026-0${Math.min(i, 9)}-15`),
      });
    }

    const summary = await sut.execute({
      tenantId: 'tenant-1',
      supplierName: 'Fornecedor B',
    });

    expect(summary.recentEntries.length).toBe(5);
  });

  it('should respect multi-tenant isolation', async () => {
    await financeEntriesRepository.create({
      tenantId: 'tenant-other',
      type: 'PAYABLE',
      code: 'PAY-001',
      description: 'Other tenant entry',
      categoryId: 'cat-1',
      supplierName: 'Fornecedor C',
      expectedAmount: 1000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-01-15'),
    });

    const summary = await sut.execute({
      tenantId: 'tenant-1',
      supplierName: 'Fornecedor C',
    });

    expect(summary.entryCount).toBe(0);
  });

  it('should work with customerName filter', async () => {
    await financeEntriesRepository.create({
      tenantId: 'tenant-1',
      type: 'RECEIVABLE',
      code: 'REC-001',
      description: 'Receivable 1',
      categoryId: 'cat-1',
      customerName: 'Cliente X',
      expectedAmount: 2000,
      status: 'PAID',
      actualAmount: 2000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-01-15'),
    });

    const summary = await sut.execute({
      tenantId: 'tenant-1',
      customerName: 'Cliente X',
    });

    expect(summary.entryCount).toBe(1);
    expect(summary.totalPaid).toBe(2000);
  });

  it('should compute monthly trend for last 6 months', async () => {
    await financeEntriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAY-001',
      description: 'Payment trend test',
      categoryId: 'cat-1',
      supplierName: 'Fornecedor Trend',
      expectedAmount: 500,
      issueDate: new Date(),
      dueDate: new Date(),
    });

    const summary = await sut.execute({
      tenantId: 'tenant-1',
      supplierName: 'Fornecedor Trend',
    });

    expect(summary.monthlyTrend.length).toBe(6);
    // At least one month should have data
    const monthsWithData = summary.monthlyTrend.filter((m) => m.count > 0);
    expect(monthsWithData.length).toBeGreaterThanOrEqual(1);
  });

  it('should treat PENDING entries past due date as overdue', async () => {
    await financeEntriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAY-001',
      description: 'Late pending',
      categoryId: 'cat-1',
      supplierName: 'Fornecedor Late',
      expectedAmount: 750,
      status: 'PENDING',
      issueDate: new Date('2025-01-01'),
      dueDate: new Date('2025-06-01'), // past due
    });

    const summary = await sut.execute({
      tenantId: 'tenant-1',
      supplierName: 'Fornecedor Late',
    });

    expect(summary.totalOverdue).toBe(750);
    expect(summary.totalPending).toBe(0);
  });
});
