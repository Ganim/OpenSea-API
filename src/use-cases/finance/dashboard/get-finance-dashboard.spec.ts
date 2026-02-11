import { InMemoryBankAccountsRepository } from '@/repositories/finance/in-memory/in-memory-bank-accounts-repository';
import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetFinanceDashboardUseCase } from './get-finance-dashboard';

let entriesRepository: InMemoryFinanceEntriesRepository;
let bankAccountsRepository: InMemoryBankAccountsRepository;
let sut: GetFinanceDashboardUseCase;

describe('GetFinanceDashboardUseCase', () => {
  beforeEach(async () => {
    entriesRepository = new InMemoryFinanceEntriesRepository();
    bankAccountsRepository = new InMemoryBankAccountsRepository();
    sut = new GetFinanceDashboardUseCase(
      entriesRepository,
      bankAccountsRepository,
    );
  });

  it('should return dashboard with all zero values when no data', async () => {
    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.totalPayable).toBe(0);
    expect(result.totalReceivable).toBe(0);
    expect(result.overduePayable).toBe(0);
    expect(result.overdueReceivable).toBe(0);
    expect(result.overduePayableCount).toBe(0);
    expect(result.overdueReceivableCount).toBe(0);
    expect(result.cashBalance).toBe(0);
    expect(result.topOverdueReceivables).toHaveLength(0);
    expect(result.topOverduePayables).toHaveLength(0);
  });

  it('should compute overdue amounts and counts', async () => {
    const pastDate = new Date('2025-01-01');

    await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Overdue payable',
      categoryId: 'cat-1',
      costCenterId: 'cc-1',
      expectedAmount: 3000,
      issueDate: new Date('2024-12-01'),
      dueDate: pastDate,
      status: 'OVERDUE',
      supplierName: 'Supplier A',
    });

    await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'RECEIVABLE',
      code: 'REC-001',
      description: 'Overdue receivable',
      categoryId: 'cat-1',
      costCenterId: 'cc-1',
      expectedAmount: 5000,
      issueDate: new Date('2024-12-01'),
      dueDate: pastDate,
      status: 'PENDING',
      customerName: 'Customer X',
    });

    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.overduePayable).toBe(3000);
    expect(result.overduePayableCount).toBe(1);
    expect(result.overdueReceivable).toBe(5000);
    expect(result.overdueReceivableCount).toBe(1);
  });

  it('should compute cash balance from active bank accounts', async () => {
    const account1 = await bankAccountsRepository.create({
      tenantId: 'tenant-1',
      companyId: 'company-1',
      name: 'Conta Corrente',
      bankCode: '001',
      agency: '1234',
      accountNumber: '12345',
      accountType: 'CHECKING',
    });
    account1.currentBalance = 15000;

    const account2 = await bankAccountsRepository.create({
      tenantId: 'tenant-1',
      companyId: 'company-1',
      name: 'Poupanca',
      bankCode: '001',
      agency: '1234',
      accountNumber: '67890',
      accountType: 'SAVINGS',
    });
    account2.currentBalance = 5000;

    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.cashBalance).toBe(20000);
  });

  it('should return top overdue receivables and payables', async () => {
    const pastDate = new Date('2025-01-01');

    // 2 overdue receivables from Customer A, 1 from Customer B
    await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'RECEIVABLE',
      code: 'REC-001',
      description: 'R1',
      categoryId: 'cat-1',
      costCenterId: 'cc-1',
      expectedAmount: 3000,
      issueDate: new Date('2024-12-01'),
      dueDate: pastDate,
      status: 'PENDING',
      customerName: 'Customer A',
    });

    await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'RECEIVABLE',
      code: 'REC-002',
      description: 'R2',
      categoryId: 'cat-1',
      costCenterId: 'cc-1',
      expectedAmount: 2000,
      issueDate: new Date('2024-12-01'),
      dueDate: pastDate,
      status: 'OVERDUE',
      customerName: 'Customer A',
    });

    await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'RECEIVABLE',
      code: 'REC-003',
      description: 'R3',
      categoryId: 'cat-1',
      costCenterId: 'cc-1',
      expectedAmount: 1000,
      issueDate: new Date('2024-12-01'),
      dueDate: pastDate,
      status: 'PENDING',
      customerName: 'Customer B',
    });

    // 1 overdue payable
    await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'P1',
      categoryId: 'cat-1',
      costCenterId: 'cc-1',
      expectedAmount: 4000,
      issueDate: new Date('2024-12-01'),
      dueDate: pastDate,
      status: 'PENDING',
      supplierName: 'Supplier Z',
    });

    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.topOverdueReceivables).toHaveLength(2);
    expect(result.topOverdueReceivables[0].name).toBe('Customer A');
    expect(result.topOverdueReceivables[0].total).toBe(5000);
    expect(result.topOverdueReceivables[0].count).toBe(2);
    expect(result.topOverdueReceivables[1].name).toBe('Customer B');

    expect(result.topOverduePayables).toHaveLength(1);
    expect(result.topOverduePayables[0].name).toBe('Supplier Z');
    expect(result.topOverduePayables[0].total).toBe(4000);
  });

  it('should return status counts', async () => {
    await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'P1',
      categoryId: 'cat-1',
      costCenterId: 'cc-1',
      expectedAmount: 1000,
      issueDate: new Date(),
      dueDate: new Date(),
      status: 'PENDING',
    });

    await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-002',
      description: 'P2',
      categoryId: 'cat-1',
      costCenterId: 'cc-1',
      expectedAmount: 2000,
      issueDate: new Date(),
      dueDate: new Date(),
      status: 'PAID',
    });

    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.statusCounts['PENDING']).toBe(1);
    expect(result.statusCounts['PAID']).toBe(1);
  });
});
