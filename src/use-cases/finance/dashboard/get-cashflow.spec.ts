import { InMemoryBankAccountsRepository } from '@/repositories/finance/in-memory/in-memory-bank-accounts-repository';
import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import { InMemoryFinanceEntryPaymentsRepository } from '@/repositories/finance/in-memory/in-memory-finance-entry-payments-repository';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GetCashflowUseCase } from './get-cashflow';

let entriesRepository: InMemoryFinanceEntriesRepository;
let bankAccountsRepository: InMemoryBankAccountsRepository;
let paymentsRepository: InMemoryFinanceEntryPaymentsRepository;
let sut: GetCashflowUseCase;

describe('GetCashflowUseCase', () => {
  beforeEach(async () => {
    entriesRepository = new InMemoryFinanceEntriesRepository();
    bankAccountsRepository = new InMemoryBankAccountsRepository();
    paymentsRepository = new InMemoryFinanceEntryPaymentsRepository();
    paymentsRepository.entriesRepository = entriesRepository;
    sut = new GetCashflowUseCase(
      entriesRepository,
      bankAccountsRepository,
      paymentsRepository,
    );
  });

  it('should return empty cashflow when no entries', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-03-31'),
      groupBy: 'month',
    });

    expect(result.data).toHaveLength(0);
    expect(result.summary.totalInflow).toBe(0);
    expect(result.summary.totalOutflow).toBe(0);
    expect(result.summary.netFlow).toBe(0);
  });

  it('should calculate inflows and outflows by month', async () => {
    // Jan receivable
    await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'RECEIVABLE',
      code: 'REC-001',
      description: 'Sale Jan',
      categoryId: 'cat-1',
      costCenterId: 'cc-1',
      expectedAmount: 10000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-01-15'),
    });

    // Jan payable
    await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Rent Jan',
      categoryId: 'cat-1',
      costCenterId: 'cc-1',
      expectedAmount: 3000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-01-20'),
    });

    // Feb receivable
    await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'RECEIVABLE',
      code: 'REC-002',
      description: 'Sale Feb',
      categoryId: 'cat-1',
      costCenterId: 'cc-1',
      expectedAmount: 8000,
      issueDate: new Date('2026-02-01'),
      dueDate: new Date('2026-02-15'),
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-02-28'),
      groupBy: 'month',
    });

    expect(result.data).toHaveLength(2);

    // January: inflow 10000, outflow 3000, net 7000
    expect(result.data[0].date).toBe('2026-01-01');
    expect(result.data[0].inflow).toBe(10000);
    expect(result.data[0].outflow).toBe(3000);
    expect(result.data[0].net).toBe(7000);

    // February: inflow 8000, outflow 0, net 8000
    expect(result.data[1].date).toBe('2026-02-01');
    expect(result.data[1].inflow).toBe(8000);
    expect(result.data[1].outflow).toBe(0);
    expect(result.data[1].net).toBe(8000);

    expect(result.summary.totalInflow).toBe(18000);
    expect(result.summary.totalOutflow).toBe(3000);
    expect(result.summary.netFlow).toBe(15000);
  });

  it('should include opening balance from bank accounts', async () => {
    const account = await bankAccountsRepository.create({
      tenantId: 'tenant-1',
      companyId: 'company-1',
      name: 'Conta Corrente',
      bankCode: '001',
      agency: '1234',
      accountNumber: '12345',
      accountType: 'CHECKING',
    });
    account.currentBalance = 50000;

    await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Expense',
      categoryId: 'cat-1',
      costCenterId: 'cc-1',
      expectedAmount: 10000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-01-15'),
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-01-31'),
      groupBy: 'month',
    });

    expect(result.summary.openingBalance).toBe(50000);
    // Closing: 50000 - 10000 = 40000
    expect(result.summary.closingBalance).toBe(40000);
    expect(result.data[0].cumulativeBalance).toBe(40000);
  });

  describe('historical opening balance (P0-11)', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('should roll current balance back to startDate by subtracting net settled movements', async () => {
      // Fake today = 2026-04-30
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-04-30T12:00:00Z'));

      const account = await bankAccountsRepository.create({
        tenantId: 'tenant-1',
        companyId: 'company-1',
        name: 'Conta Corrente',
        bankCode: '001',
        agency: '1234',
        accountNumber: '12345',
        accountType: 'CHECKING',
      });
      // Current (today's) balance
      account.currentBalance = 50000;

      // A RECEIVABLE was paid on 2026-02-10 — already baked into 50k today
      const receivable = await entriesRepository.create({
        tenantId: 'tenant-1',
        type: 'RECEIVABLE',
        code: 'REC-100',
        description: 'Venda paga em fev',
        categoryId: 'cat-1',
        costCenterId: 'cc-1',
        expectedAmount: 20000,
        issueDate: new Date('2026-02-01'),
        dueDate: new Date('2026-02-08'),
        status: 'RECEIVED',
      });
      await paymentsRepository.create({
        entryId: receivable.id.toString(),
        amount: 20000,
        paidAt: new Date('2026-02-10'),
      });

      // A PAYABLE paid on 2026-03-05 — already baked into 50k today
      const payable = await entriesRepository.create({
        tenantId: 'tenant-1',
        type: 'PAYABLE',
        code: 'PAG-100',
        description: 'Aluguel mar',
        categoryId: 'cat-1',
        costCenterId: 'cc-1',
        expectedAmount: 5000,
        issueDate: new Date('2026-03-01'),
        dueDate: new Date('2026-03-05'),
        status: 'PAID',
      });
      await paymentsRepository.create({
        entryId: payable.id.toString(),
        amount: 5000,
        paidAt: new Date('2026-03-05'),
      });

      // Ask for a report starting 2026-01-01 — openingBalance should be the
      // balance BEFORE the feb + mar movements:
      // 50000 − (20000 − 5000) = 35000
      const result = await sut.execute({
        tenantId: 'tenant-1',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-04-30'),
        groupBy: 'month',
      });

      expect(result.summary.openingBalance).toBe(35000);
    });

    it('should use current balance as opening when startDate is in the future', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-04-30T12:00:00Z'));

      const account = await bankAccountsRepository.create({
        tenantId: 'tenant-1',
        companyId: 'company-1',
        name: 'Conta Corrente',
        bankCode: '001',
        agency: '1234',
        accountNumber: '12345',
        accountType: 'CHECKING',
      });
      account.currentBalance = 50000;

      const result = await sut.execute({
        tenantId: 'tenant-1',
        startDate: new Date('2026-05-01'),
        endDate: new Date('2026-07-31'),
        groupBy: 'month',
      });

      // startDate > now → we can't roll forward; use today's balance.
      expect(result.summary.openingBalance).toBe(50000);
    });
  });
});
