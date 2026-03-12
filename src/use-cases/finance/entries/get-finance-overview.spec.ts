import { InMemoryBankAccountsRepository } from '@/repositories/finance/in-memory/in-memory-bank-accounts-repository';
import { InMemoryConsortiaRepository } from '@/repositories/finance/in-memory/in-memory-consortia-repository';
import { InMemoryContractsRepository } from '@/repositories/finance/in-memory/in-memory-contracts-repository';
import { InMemoryCostCentersRepository } from '@/repositories/finance/in-memory/in-memory-cost-centers-repository';
import { InMemoryFinanceCategoriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-categories-repository';
import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import { InMemoryLoansRepository } from '@/repositories/finance/in-memory/in-memory-loans-repository';
import { InMemoryRecurringConfigsRepository } from '@/repositories/finance/in-memory/in-memory-recurring-configs-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetFinanceOverviewUseCase } from './get-finance-overview';

let entriesRepository: InMemoryFinanceEntriesRepository;
let loansRepository: InMemoryLoansRepository;
let consortiaRepository: InMemoryConsortiaRepository;
let contractsRepository: InMemoryContractsRepository;
let recurringConfigsRepository: InMemoryRecurringConfigsRepository;
let bankAccountsRepository: InMemoryBankAccountsRepository;
let categoriesRepository: InMemoryFinanceCategoriesRepository;
let costCentersRepository: InMemoryCostCentersRepository;
let sut: GetFinanceOverviewUseCase;

describe('GetFinanceOverviewUseCase', () => {
  beforeEach(() => {
    entriesRepository = new InMemoryFinanceEntriesRepository();
    loansRepository = new InMemoryLoansRepository();
    consortiaRepository = new InMemoryConsortiaRepository();
    contractsRepository = new InMemoryContractsRepository();
    recurringConfigsRepository = new InMemoryRecurringConfigsRepository();
    bankAccountsRepository = new InMemoryBankAccountsRepository();
    categoriesRepository = new InMemoryFinanceCategoriesRepository();
    costCentersRepository = new InMemoryCostCentersRepository();

    sut = new GetFinanceOverviewUseCase(
      entriesRepository,
      loansRepository,
      consortiaRepository,
      contractsRepository,
      recurringConfigsRepository,
      bankAccountsRepository,
      categoriesRepository,
      costCentersRepository,
    );
  });

  it('should return all zero counts when no data exists', async () => {
    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.payable).toEqual({ total: 0, pending: 0, overdue: 0 });
    expect(result.receivable).toEqual({ total: 0, pending: 0, overdue: 0 });
    expect(result.loans).toEqual({ total: 0, active: 0 });
    expect(result.consortia).toEqual({ total: 0, active: 0 });
    expect(result.contracts).toEqual({ total: 0, active: 0 });
    expect(result.recurring).toEqual({ total: 0, active: 0 });
    expect(result.bankAccounts).toBe(0);
    expect(result.categories).toBe(0);
    expect(result.costCenters).toBe(0);
  });

  it('should count payable entries by status', async () => {
    await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Pending payable',
      categoryId: 'cat-1',
      expectedAmount: 1000,
      issueDate: new Date(),
      dueDate: new Date(),
      status: 'PENDING',
    });

    await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-002',
      description: 'Overdue payable',
      categoryId: 'cat-1',
      expectedAmount: 2000,
      issueDate: new Date(),
      dueDate: new Date('2025-01-01'),
      status: 'OVERDUE',
    });

    await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-003',
      description: 'Paid payable',
      categoryId: 'cat-1',
      expectedAmount: 500,
      issueDate: new Date(),
      dueDate: new Date(),
      status: 'PAID',
    });

    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.payable.total).toBe(3);
    expect(result.payable.pending).toBe(1);
    expect(result.payable.overdue).toBe(1);
  });

  it('should count receivable entries by status', async () => {
    await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'RECEIVABLE',
      code: 'REC-001',
      description: 'Pending receivable',
      categoryId: 'cat-1',
      expectedAmount: 3000,
      issueDate: new Date(),
      dueDate: new Date(),
      status: 'PENDING',
    });

    await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'RECEIVABLE',
      code: 'REC-002',
      description: 'Overdue receivable',
      categoryId: 'cat-1',
      expectedAmount: 1500,
      issueDate: new Date(),
      dueDate: new Date('2025-01-01'),
      status: 'OVERDUE',
    });

    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.receivable.total).toBe(2);
    expect(result.receivable.pending).toBe(1);
    expect(result.receivable.overdue).toBe(1);
  });

  it('should count loans with active filter', async () => {
    await loansRepository.create({
      tenantId: 'tenant-1',
      bankAccountId: 'ba-1',
      costCenterId: 'cc-1',
      name: 'Active loan',
      type: 'PERSONAL',
      principalAmount: 10000,
      outstandingBalance: 8000,
      interestRate: 1.5,
      startDate: new Date(),
      totalInstallments: 12,
    });

    const paidOffLoan = await loansRepository.create({
      tenantId: 'tenant-1',
      bankAccountId: 'ba-1',
      costCenterId: 'cc-1',
      name: 'Paid off loan',
      type: 'PERSONAL',
      principalAmount: 5000,
      outstandingBalance: 0,
      interestRate: 1.0,
      startDate: new Date(),
      totalInstallments: 6,
    });
    paidOffLoan.status = 'PAID_OFF';

    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.loans.total).toBe(2);
    expect(result.loans.active).toBe(1);
  });

  it('should count consortia with active filter', async () => {
    await consortiaRepository.create({
      tenantId: 'tenant-1',
      bankAccountId: 'ba-1',
      costCenterId: 'cc-1',
      name: 'Active consortium',
      administrator: 'Admin Co',
      creditValue: 50000,
      monthlyPayment: 1000,
      totalInstallments: 60,
      startDate: new Date(),
    });

    const cancelledConsortium = await consortiaRepository.create({
      tenantId: 'tenant-1',
      bankAccountId: 'ba-1',
      costCenterId: 'cc-1',
      name: 'Cancelled consortium',
      administrator: 'Admin Co',
      creditValue: 30000,
      monthlyPayment: 800,
      totalInstallments: 48,
      startDate: new Date(),
    });
    cancelledConsortium.status = 'CANCELLED';

    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.consortia.total).toBe(2);
    expect(result.consortia.active).toBe(1);
  });

  it('should count contracts with active filter', async () => {
    await contractsRepository.create({
      tenantId: 'tenant-1',
      code: 'CT-001',
      title: 'Active contract',
      companyName: 'Company A',
      totalValue: 12000,
      paymentFrequency: 'MONTHLY',
      paymentAmount: 1000,
      startDate: new Date(),
      endDate: new Date('2027-01-01'),
    });

    const _expiredContract = await contractsRepository.create({
      tenantId: 'tenant-1',
      code: 'CT-002',
      title: 'Expired contract',
      companyName: 'Company B',
      totalValue: 6000,
      paymentFrequency: 'MONTHLY',
      paymentAmount: 500,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2025-01-01'),
      status: 'EXPIRED',
    });

    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.contracts.total).toBe(2);
    expect(result.contracts.active).toBe(1);
  });

  it('should count recurring configs with active filter', async () => {
    await recurringConfigsRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      description: 'Monthly rent',
      categoryId: 'cat-1',
      expectedAmount: 2000,
      frequencyUnit: 'MONTH',
      startDate: new Date(),
    });

    const pausedConfig = await recurringConfigsRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      description: 'Paused subscription',
      categoryId: 'cat-1',
      expectedAmount: 100,
      frequencyUnit: 'MONTH',
      startDate: new Date(),
    });
    await recurringConfigsRepository.update({
      id: pausedConfig.id.toString(),
      tenantId: 'tenant-1',
      status: 'PAUSED',
    });

    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.recurring.total).toBe(2);
    expect(result.recurring.active).toBe(1);
  });

  it('should count bank accounts, categories, and cost centers', async () => {
    await bankAccountsRepository.create({
      tenantId: 'tenant-1',
      name: 'Conta Corrente',
      bankCode: '001',
      agency: '1234',
      accountNumber: '12345',
      accountType: 'CHECKING',
    });

    await bankAccountsRepository.create({
      tenantId: 'tenant-1',
      name: 'Poupanca',
      bankCode: '001',
      agency: '1234',
      accountNumber: '67890',
      accountType: 'SAVINGS',
    });

    await categoriesRepository.create({
      tenantId: 'tenant-1',
      name: 'Aluguel',
      slug: 'aluguel',
      type: 'PAYABLE',
    });

    await costCentersRepository.create({
      tenantId: 'tenant-1',
      code: 'CC-001',
      name: 'Administrativo',
    });

    await costCentersRepository.create({
      tenantId: 'tenant-1',
      code: 'CC-002',
      name: 'Comercial',
    });

    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.bankAccounts).toBe(2);
    expect(result.categories).toBe(1);
    expect(result.costCenters).toBe(2);
  });

  it('should isolate data by tenant', async () => {
    await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Tenant 1 entry',
      categoryId: 'cat-1',
      expectedAmount: 1000,
      issueDate: new Date(),
      dueDate: new Date(),
      status: 'PENDING',
    });

    await entriesRepository.create({
      tenantId: 'tenant-2',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Tenant 2 entry',
      categoryId: 'cat-1',
      expectedAmount: 2000,
      issueDate: new Date(),
      dueDate: new Date(),
      status: 'PENDING',
    });

    await bankAccountsRepository.create({
      tenantId: 'tenant-2',
      name: 'Other tenant account',
      bankCode: '001',
      agency: '1234',
      accountNumber: '99999',
      accountType: 'CHECKING',
    });

    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.payable.total).toBe(1);
    expect(result.payable.pending).toBe(1);
    expect(result.bankAccounts).toBe(0);
  });
});
