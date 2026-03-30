import { beforeEach, describe, expect, it } from 'vitest';
import { CheckCashFlowAlertsUseCase } from './check-cashflow-alerts';
import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import { InMemoryBankAccountsRepository } from '@/repositories/finance/in-memory/in-memory-bank-accounts-repository';

function daysFromNow(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

describe('CheckCashFlowAlertsUseCase', () => {
  let sut: CheckCashFlowAlertsUseCase;
  let bankAccountsRepository: InMemoryBankAccountsRepository;
  let financeEntriesRepository: InMemoryFinanceEntriesRepository;

  beforeEach(() => {
    bankAccountsRepository = new InMemoryBankAccountsRepository();
    financeEntriesRepository = new InMemoryFinanceEntriesRepository();
    sut = new CheckCashFlowAlertsUseCase(
      bankAccountsRepository,
      financeEntriesRepository,
    );
  });

  it('should return no alerts when balance is healthy', async () => {
    await bankAccountsRepository.create({
      tenantId: 'tenant-1',
      name: 'Conta Corrente',
      bankCode: '001',
      agency: '1234',
      accountNumber: '12345',
      accountType: 'CHECKING',
    });

    // Set a healthy balance
    bankAccountsRepository.items[0].currentBalance = 100_000;

    // Small payable entry
    await financeEntriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAY-001',
      description: 'Conta de luz',
      categoryId: 'cat-1',
      expectedAmount: 500,
      status: 'PENDING',
      issueDate: new Date(),
      dueDate: daysFromNow(3),
    });

    const { alerts, nextSevenDays } = await sut.execute({
      tenantId: 'tenant-1',
    });

    expect(alerts).toHaveLength(0);
    expect(nextSevenDays.totalOutflows).toBe(500);
    expect(nextSevenDays.projectedBalance).toBeGreaterThan(0);
  });

  it('should generate CRITICAL alert when projected balance becomes negative', async () => {
    await bankAccountsRepository.create({
      tenantId: 'tenant-1',
      name: 'Conta Corrente',
      bankCode: '001',
      agency: '1234',
      accountNumber: '12345',
      accountType: 'CHECKING',
    });

    bankAccountsRepository.items[0].currentBalance = 5_000;

    // Large payable that exceeds balance
    await financeEntriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAY-001',
      description: 'Pagamento folha',
      categoryId: 'cat-1',
      expectedAmount: 8_000,
      status: 'PENDING',
      issueDate: new Date(),
      dueDate: daysFromNow(2),
    });

    const { alerts } = await sut.execute({ tenantId: 'tenant-1' });

    const criticalAlert = alerts.find((a) => a.type === 'NEGATIVE_BALANCE');
    expect(criticalAlert).toBeDefined();
    expect(criticalAlert!.severity).toBe('CRITICAL');
    expect(criticalAlert!.projectedBalance).toBeLessThan(0);
  });

  it('should generate WARNING alert when balance drops below 10% of current', async () => {
    await bankAccountsRepository.create({
      tenantId: 'tenant-1',
      name: 'Conta Corrente',
      bankCode: '001',
      agency: '1234',
      accountNumber: '12345',
      accountType: 'CHECKING',
    });

    bankAccountsRepository.items[0].currentBalance = 10_000;

    // Payable that leaves only 5% of balance
    await financeEntriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAY-001',
      description: 'Pagamento fornecedor',
      categoryId: 'cat-1',
      expectedAmount: 9_600,
      status: 'PENDING',
      issueDate: new Date(),
      dueDate: daysFromNow(3),
    });

    const { alerts } = await sut.execute({ tenantId: 'tenant-1' });

    const lowBalanceAlert = alerts.find((a) => a.type === 'LOW_BALANCE');
    expect(lowBalanceAlert).toBeDefined();
    expect(lowBalanceAlert!.severity).toBe('WARNING');
  });

  it('should generate LARGE_OUTFLOW alert when single entry exceeds 30% of balance', async () => {
    await bankAccountsRepository.create({
      tenantId: 'tenant-1',
      name: 'Conta Corrente',
      bankCode: '001',
      agency: '1234',
      accountNumber: '12345',
      accountType: 'CHECKING',
    });

    bankAccountsRepository.items[0].currentBalance = 50_000;

    // Large single outflow (40% of balance)
    await financeEntriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAY-001',
      description: 'Compra de equipamento',
      categoryId: 'cat-1',
      expectedAmount: 20_000,
      status: 'PENDING',
      issueDate: new Date(),
      dueDate: daysFromNow(5),
    });

    const { alerts } = await sut.execute({ tenantId: 'tenant-1' });

    const largeOutflowAlert = alerts.find((a) => a.type === 'LARGE_OUTFLOW');
    expect(largeOutflowAlert).toBeDefined();
    expect(largeOutflowAlert!.severity).toBe('WARNING');
    expect(largeOutflowAlert!.message).toContain('40%');
  });

  it('should aggregate balance from multiple bank accounts', async () => {
    await bankAccountsRepository.create({
      tenantId: 'tenant-1',
      name: 'Conta Corrente Itaú',
      bankCode: '341',
      agency: '1234',
      accountNumber: '12345',
      accountType: 'CHECKING',
    });

    await bankAccountsRepository.create({
      tenantId: 'tenant-1',
      name: 'Conta Corrente Bradesco',
      bankCode: '237',
      agency: '5678',
      accountNumber: '67890',
      accountType: 'CHECKING',
    });

    bankAccountsRepository.items[0].currentBalance = 3_000;
    bankAccountsRepository.items[1].currentBalance = 7_000;

    // Total balance = 10,000, no entries, so no alerts
    const { alerts, nextSevenDays } = await sut.execute({
      tenantId: 'tenant-1',
    });

    expect(alerts).toHaveLength(0);
    expect(nextSevenDays.projectedBalance).toBe(10_000);
  });

  it('should consider receivables as inflows', async () => {
    await bankAccountsRepository.create({
      tenantId: 'tenant-1',
      name: 'Conta Corrente',
      bankCode: '001',
      agency: '1234',
      accountNumber: '12345',
      accountType: 'CHECKING',
    });

    bankAccountsRepository.items[0].currentBalance = 5_000;

    // Large payable
    await financeEntriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAY-001',
      description: 'Pagamento fornecedor',
      categoryId: 'cat-1',
      expectedAmount: 8_000,
      status: 'PENDING',
      issueDate: new Date(),
      dueDate: daysFromNow(4),
    });

    // Receivable that offsets it
    await financeEntriesRepository.create({
      tenantId: 'tenant-1',
      type: 'RECEIVABLE',
      code: 'REC-001',
      description: 'Recebimento cliente',
      categoryId: 'cat-2',
      expectedAmount: 10_000,
      status: 'PENDING',
      issueDate: new Date(),
      dueDate: daysFromNow(2),
    });

    const { nextSevenDays } = await sut.execute({ tenantId: 'tenant-1' });

    expect(nextSevenDays.totalInflows).toBe(10_000);
    expect(nextSevenDays.totalOutflows).toBe(8_000);
    expect(nextSevenDays.projectedBalance).toBe(7_000);
  });

  it('should respect multi-tenant isolation', async () => {
    await bankAccountsRepository.create({
      tenantId: 'tenant-1',
      name: 'Conta Corrente',
      bankCode: '001',
      agency: '1234',
      accountNumber: '12345',
      accountType: 'CHECKING',
    });

    bankAccountsRepository.items[0].currentBalance = 1_000;

    // Entry in different tenant
    await financeEntriesRepository.create({
      tenantId: 'tenant-other',
      type: 'PAYABLE',
      code: 'PAY-001',
      description: 'Pagamento outro tenant',
      categoryId: 'cat-1',
      expectedAmount: 50_000,
      status: 'PENDING',
      issueDate: new Date(),
      dueDate: daysFromNow(3),
    });

    const { nextSevenDays } = await sut.execute({ tenantId: 'tenant-1' });

    expect(nextSevenDays.totalOutflows).toBe(0);
    expect(nextSevenDays.projectedBalance).toBe(1_000);
  });

  it('should handle zero balance with no entries', async () => {
    const { alerts, nextSevenDays } = await sut.execute({
      tenantId: 'tenant-1',
    });

    expect(alerts).toHaveLength(0);
    expect(nextSevenDays.totalInflows).toBe(0);
    expect(nextSevenDays.totalOutflows).toBe(0);
    expect(nextSevenDays.projectedBalance).toBe(0);
  });

  it('should not count entries beyond 7 days', async () => {
    await bankAccountsRepository.create({
      tenantId: 'tenant-1',
      name: 'Conta Corrente',
      bankCode: '001',
      agency: '1234',
      accountNumber: '12345',
      accountType: 'CHECKING',
    });

    bankAccountsRepository.items[0].currentBalance = 10_000;

    // Entry due in 15 days (outside 7-day window)
    await financeEntriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAY-001',
      description: 'Pagamento futuro',
      categoryId: 'cat-1',
      expectedAmount: 50_000,
      status: 'PENDING',
      issueDate: new Date(),
      dueDate: daysFromNow(15),
    });

    const { nextSevenDays } = await sut.execute({ tenantId: 'tenant-1' });

    expect(nextSevenDays.totalOutflows).toBe(0);
    expect(nextSevenDays.projectedBalance).toBe(10_000);
  });

  it('should ignore inactive bank accounts', async () => {
    await bankAccountsRepository.create({
      tenantId: 'tenant-1',
      name: 'Conta Inativa',
      bankCode: '001',
      agency: '1234',
      accountNumber: '12345',
      accountType: 'CHECKING',
    });

    bankAccountsRepository.items[0].currentBalance = 100_000;
    bankAccountsRepository.items[0].status = 'INACTIVE';

    await bankAccountsRepository.create({
      tenantId: 'tenant-1',
      name: 'Conta Ativa',
      bankCode: '237',
      agency: '5678',
      accountNumber: '67890',
      accountType: 'CHECKING',
    });

    bankAccountsRepository.items[1].currentBalance = 2_000;

    const { nextSevenDays } = await sut.execute({ tenantId: 'tenant-1' });

    // Should only consider the active account balance of 2,000
    expect(nextSevenDays.projectedBalance).toBe(2_000);
  });
});
