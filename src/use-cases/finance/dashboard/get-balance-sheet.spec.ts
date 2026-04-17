import { InMemoryChartOfAccountsRepository } from '@/repositories/finance/in-memory/in-memory-chart-of-accounts-repository';
import { InMemoryJournalEntriesRepository } from '@/repositories/finance/in-memory/in-memory-journal-entries-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetBalanceSheetUseCase } from './get-balance-sheet';

let chartOfAccountsRepository: InMemoryChartOfAccountsRepository;
let journalEntriesRepository: InMemoryJournalEntriesRepository;
let sut: GetBalanceSheetUseCase;

async function seedAccount(
  data: Parameters<InMemoryChartOfAccountsRepository['create']>[0],
) {
  const account = await chartOfAccountsRepository.create(data);
  journalEntriesRepository.chartOfAccounts.push({
    id: account.id.toString(),
    code: account.code,
    name: account.name,
    type: account.type,
    nature: account.nature,
  });
  return account;
}

describe('GetBalanceSheetUseCase', () => {
  beforeEach(() => {
    chartOfAccountsRepository = new InMemoryChartOfAccountsRepository();
    journalEntriesRepository = new InMemoryJournalEntriesRepository();
    sut = new GetBalanceSheetUseCase(
      chartOfAccountsRepository,
      journalEntriesRepository,
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
    await seedAccount({
      tenantId: 'tenant-1',
      code: '1.1',
      name: 'Caixa e Equivalentes',
      type: 'ASSET',
      accountClass: 'CURRENT',
      nature: 'DEBIT',
    });

    await seedAccount({
      tenantId: 'tenant-1',
      code: '2.1',
      name: 'Fornecedores',
      type: 'LIABILITY',
      accountClass: 'CURRENT',
      nature: 'CREDIT',
    });

    await seedAccount({
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
    await seedAccount({
      tenantId: 'tenant-1',
      code: '1.1',
      name: 'Caixa',
      type: 'ASSET',
      accountClass: 'CURRENT',
      nature: 'DEBIT',
    });

    await seedAccount({
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
    await seedAccount({
      tenantId: 'tenant-1',
      code: '1.1',
      name: 'Caixa',
      type: 'ASSET',
      accountClass: 'CURRENT',
      nature: 'DEBIT',
    });

    await seedAccount({
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

  it('should reflect per-account balances from the trial balance', async () => {
    const caixa = await seedAccount({
      tenantId: 'tenant-1',
      code: '1.1',
      name: 'Caixa',
      type: 'ASSET',
      accountClass: 'CURRENT',
      nature: 'DEBIT',
    });
    const fornecedores = await seedAccount({
      tenantId: 'tenant-1',
      code: '2.1',
      name: 'Fornecedores',
      type: 'LIABILITY',
      accountClass: 'CURRENT',
      nature: 'CREDIT',
    });
    const capital = await seedAccount({
      tenantId: 'tenant-1',
      code: '3.1',
      name: 'Capital Social',
      type: 'EQUITY',
      accountClass: 'OTHER',
      nature: 'CREDIT',
    });

    // Integralization: Capital (credit) → Caixa (debit), 10.000
    await journalEntriesRepository.create({
      tenantId: 'tenant-1',
      code: 'JE-001',
      date: new Date('2026-01-05'),
      description: 'Integralização',
      sourceType: 'MANUAL',
      lines: [
        {
          chartOfAccountId: caixa.id.toString(),
          type: 'DEBIT',
          amount: 10000,
        },
        {
          chartOfAccountId: capital.id.toString(),
          type: 'CREDIT',
          amount: 10000,
        },
      ],
    });

    // Supplier invoice: Fornecedores (credit) → Caixa (debit) reduction, 3.000
    await journalEntriesRepository.create({
      tenantId: 'tenant-1',
      code: 'JE-002',
      date: new Date('2026-02-10'),
      description: 'Compra a prazo',
      sourceType: 'MANUAL',
      lines: [
        {
          chartOfAccountId: caixa.id.toString(),
          type: 'CREDIT',
          amount: 3000,
        },
        {
          chartOfAccountId: fornecedores.id.toString(),
          type: 'CREDIT',
          amount: 3000,
        },
      ],
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
    });

    // Caixa: 10.000 debit − 3.000 credit = 7.000
    expect(result.assets.current[0].balance).toBe(7000);
    // Fornecedores: 3.000 credit − 0 debit = 3.000
    expect(result.liabilities.current[0].balance).toBe(3000);
    // Capital Social: 10.000 credit − 0 debit = 10.000
    expect(result.equity.items[0].balance).toBe(10000);

    expect(result.assets.total).toBe(7000);
    expect(result.liabilities.total).toBe(3000);
    expect(result.equity.total).toBe(10000);
    expect(result.totalLiabilitiesAndEquity).toBe(13000);
    // Assets ≠ L+E here because the supplier entry is intentionally
    // unbalanced (one-sided). The isBalanced flag surfaces the drift
    // so the UI can warn the accountant.
    expect(result.isBalanced).toBe(false);
  });
});
