import { InMemoryChartOfAccountsRepository } from '@/repositories/finance/in-memory/in-memory-chart-of-accounts-repository';
import { InMemoryJournalEntriesRepository } from '@/repositories/finance/in-memory/in-memory-journal-entries-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetTrialBalanceUseCase } from './get-trial-balance';

const TENANT_ID = 'tenant-1';

let chartOfAccountsRepository: InMemoryChartOfAccountsRepository;
let journalEntriesRepository: InMemoryJournalEntriesRepository;
let sut: GetTrialBalanceUseCase;

describe('GetTrialBalanceUseCase', () => {
  beforeEach(() => {
    chartOfAccountsRepository = new InMemoryChartOfAccountsRepository();
    journalEntriesRepository = new InMemoryJournalEntriesRepository();
    sut = new GetTrialBalanceUseCase(journalEntriesRepository);
  });

  async function seedAccounts() {
    const cash = await chartOfAccountsRepository.create({
      tenantId: TENANT_ID,
      code: '1.1.1',
      name: 'Caixa',
      type: 'ASSET',
      accountClass: 'CURRENT',
      nature: 'DEBIT',
    });

    const revenue = await chartOfAccountsRepository.create({
      tenantId: TENANT_ID,
      code: '3.1.1',
      name: 'Receitas de Vendas',
      type: 'REVENUE',
      accountClass: 'INCOME',
      nature: 'CREDIT',
    });

    // Register in journal repository for metadata
    journalEntriesRepository.chartOfAccounts.push({
      id: cash.id.toString(),
      code: cash.code,
      name: cash.name,
      type: cash.type,
      nature: cash.nature,
    });
    journalEntriesRepository.chartOfAccounts.push({
      id: revenue.id.toString(),
      code: revenue.code,
      name: revenue.name,
      type: revenue.type,
      nature: revenue.nature,
    });

    return { cash, revenue };
  }

  it('should return all accounts with balances aggregated', async () => {
    const { cash, revenue } = await seedAccounts();
    const cashId = cash.id.toString();
    const revenueId = revenue.id.toString();

    const from = new Date('2024-01-01');
    const to = new Date('2024-01-31');

    await journalEntriesRepository.create({
      tenantId: TENANT_ID,
      code: 'LC-000001',
      date: new Date('2024-01-10'),
      description: 'Venda à vista',
      sourceType: 'MANUAL',
      lines: [
        { chartOfAccountId: cashId, type: 'DEBIT', amount: 1500 },
        { chartOfAccountId: revenueId, type: 'CREDIT', amount: 1500 },
      ],
    });

    await journalEntriesRepository.create({
      tenantId: TENANT_ID,
      code: 'LC-000002',
      date: new Date('2024-01-20'),
      description: 'Outra venda',
      sourceType: 'MANUAL',
      lines: [
        { chartOfAccountId: cashId, type: 'DEBIT', amount: 500 },
        { chartOfAccountId: revenueId, type: 'CREDIT', amount: 500 },
      ],
    });

    const result = await sut.execute({ tenantId: TENANT_ID, from, to });

    expect(result.period.from).toEqual(from);
    expect(result.period.to).toEqual(to);
    expect(result.accounts).toHaveLength(2);

    const cashAccount = result.accounts.find((a) => a.id === cashId);
    expect(cashAccount).toBeDefined();
    expect(cashAccount!.debitTotal).toBe(2000);
    expect(cashAccount!.creditTotal).toBe(0);

    const revenueAccount = result.accounts.find((a) => a.id === revenueId);
    expect(revenueAccount).toBeDefined();
    expect(revenueAccount!.debitTotal).toBe(0);
    expect(revenueAccount!.creditTotal).toBe(2000);
  });

  it('should have balanced totals (debits == credits) when all entries are balanced', async () => {
    const { cash, revenue } = await seedAccounts();
    const cashId = cash.id.toString();
    const revenueId = revenue.id.toString();

    const from = new Date('2024-01-01');
    const to = new Date('2024-01-31');

    // Create balanced journal entries
    await journalEntriesRepository.create({
      tenantId: TENANT_ID,
      code: 'LC-000001',
      date: new Date('2024-01-05'),
      description: 'Lançamento balanceado A',
      sourceType: 'MANUAL',
      lines: [
        { chartOfAccountId: cashId, type: 'DEBIT', amount: 3000 },
        { chartOfAccountId: revenueId, type: 'CREDIT', amount: 3000 },
      ],
    });

    await journalEntriesRepository.create({
      tenantId: TENANT_ID,
      code: 'LC-000002',
      date: new Date('2024-01-15'),
      description: 'Lançamento balanceado B',
      sourceType: 'MANUAL',
      lines: [
        { chartOfAccountId: cashId, type: 'DEBIT', amount: 1000 },
        { chartOfAccountId: revenueId, type: 'CREDIT', amount: 1000 },
      ],
    });

    const result = await sut.execute({ tenantId: TENANT_ID, from, to });

    // In a double-entry system, total debits must equal total credits
    expect(result.totals.debit).toBe(result.totals.credit);
    expect(result.totals.debit).toBe(4000);
    expect(result.totals.credit).toBe(4000);
  });

  it('should return empty accounts array when no journal entries exist', async () => {
    // Seed accounts but do not create any journal entries
    await seedAccounts();

    const result = await sut.execute({
      tenantId: TENANT_ID,
      from: new Date('2024-01-01'),
      to: new Date('2024-01-31'),
    });

    expect(result.accounts).toHaveLength(0);
    expect(result.totals.debit).toBe(0);
    expect(result.totals.credit).toBe(0);
  });
});
