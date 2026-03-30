import { InMemoryChartOfAccountsRepository } from '@/repositories/finance/in-memory/in-memory-chart-of-accounts-repository';
import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetBalanceSheetUseCase } from './get-balance-sheet';

let chartOfAccountsRepository: InMemoryChartOfAccountsRepository;
let financeEntriesRepository: InMemoryFinanceEntriesRepository;
let sut: GetBalanceSheetUseCase;

describe('GetBalanceSheetUseCase', () => {
  beforeEach(() => {
    chartOfAccountsRepository = new InMemoryChartOfAccountsRepository();
    financeEntriesRepository = new InMemoryFinanceEntriesRepository();
    sut = new GetBalanceSheetUseCase(
      chartOfAccountsRepository,
      financeEntriesRepository,
    );
  });

  it('should return empty balance sheet when no accounts exist', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
    });

    expect(result.assets.total).toBe(0);
    expect(result.liabilities.total).toBe(0);
    expect(result.equity.total).toBe(0);
    expect(result.isBalanced).toBe(true);
  });

  it('should return balance sheet structure with accounts', async () => {
    await chartOfAccountsRepository.create({
      tenantId: 'tenant-1',
      code: '1.1',
      name: 'Caixa e Equivalentes',
      type: 'ASSET',
      accountClass: 'CURRENT',
      nature: 'DEBIT',
    });

    await chartOfAccountsRepository.create({
      tenantId: 'tenant-1',
      code: '2.1',
      name: 'Fornecedores',
      type: 'LIABILITY',
      accountClass: 'CURRENT',
      nature: 'CREDIT',
    });

    await chartOfAccountsRepository.create({
      tenantId: 'tenant-1',
      code: '3.1',
      name: 'Capital Social',
      type: 'EQUITY',
      accountClass: 'OTHER',
      nature: 'CREDIT',
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
    });

    expect(result.period.start).toEqual(new Date('2026-01-01'));
    expect(result.period.end).toEqual(new Date('2026-12-31'));
    expect(result.assets.current).toHaveLength(1);
    expect(result.liabilities.current).toHaveLength(1);
    expect(result.equity.items).toHaveLength(1);
  });

  it('should separate current and non-current accounts', async () => {
    await chartOfAccountsRepository.create({
      tenantId: 'tenant-1',
      code: '1.1',
      name: 'Caixa',
      type: 'ASSET',
      accountClass: 'CURRENT',
      nature: 'DEBIT',
    });

    await chartOfAccountsRepository.create({
      tenantId: 'tenant-1',
      code: '1.2',
      name: 'Imobilizado',
      type: 'ASSET',
      accountClass: 'NON_CURRENT',
      nature: 'DEBIT',
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
    });

    expect(result.assets.current).toHaveLength(1);
    expect(result.assets.nonCurrent).toHaveLength(1);
    expect(result.assets.current[0].name).toBe('Caixa');
    expect(result.assets.nonCurrent[0].name).toBe('Imobilizado');
  });

  it('should only include accounts for specified tenant', async () => {
    await chartOfAccountsRepository.create({
      tenantId: 'tenant-1',
      code: '1.1',
      name: 'Caixa',
      type: 'ASSET',
      accountClass: 'CURRENT',
      nature: 'DEBIT',
    });

    await chartOfAccountsRepository.create({
      tenantId: 'tenant-2',
      code: '1.1',
      name: 'Caixa Outro Tenant',
      type: 'ASSET',
      accountClass: 'CURRENT',
      nature: 'DEBIT',
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
    });

    expect(result.assets.current).toHaveLength(1);
    expect(result.assets.current[0].name).toBe('Caixa');
  });
});
