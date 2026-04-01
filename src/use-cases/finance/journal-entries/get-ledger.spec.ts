import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryChartOfAccountsRepository } from '@/repositories/finance/in-memory/in-memory-chart-of-accounts-repository';
import { InMemoryJournalEntriesRepository } from '@/repositories/finance/in-memory/in-memory-journal-entries-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetLedgerUseCase } from './get-ledger';

const TENANT_ID = 'tenant-1';

let chartOfAccountsRepository: InMemoryChartOfAccountsRepository;
let journalEntriesRepository: InMemoryJournalEntriesRepository;
let sut: GetLedgerUseCase;

describe('GetLedgerUseCase', () => {
  beforeEach(() => {
    chartOfAccountsRepository = new InMemoryChartOfAccountsRepository();
    journalEntriesRepository = new InMemoryJournalEntriesRepository();
    sut = new GetLedgerUseCase(
      chartOfAccountsRepository,
      journalEntriesRepository,
    );
  });

  it('should return ledger entries with running balance for a DEBIT nature account', async () => {
    const account = await chartOfAccountsRepository.create({
      tenantId: TENANT_ID,
      code: '1.1.1',
      name: 'Caixa',
      type: 'ASSET',
      accountClass: 'CURRENT',
      nature: 'DEBIT',
    });

    const accountId = account.id.toString();

    // Register the account in journal entries repository for metadata
    journalEntriesRepository.chartOfAccounts.push({
      id: accountId,
      code: account.code,
      name: account.name,
      type: account.type,
      nature: account.nature,
    });

    // Create a contra account for balanced entries
    const contraAccount = await chartOfAccountsRepository.create({
      tenantId: TENANT_ID,
      code: '3.1.1',
      name: 'Receitas',
      type: 'REVENUE',
      accountClass: 'INCOME',
      nature: 'CREDIT',
    });
    const contraId = contraAccount.id.toString();
    journalEntriesRepository.chartOfAccounts.push({
      id: contraId,
      code: contraAccount.code,
      name: contraAccount.name,
      type: contraAccount.type,
      nature: contraAccount.nature,
    });

    const from = new Date('2024-01-01');
    const to = new Date('2024-01-31');

    // Create a journal entry within the period
    await journalEntriesRepository.create({
      tenantId: TENANT_ID,
      code: 'LC-000001',
      date: new Date('2024-01-10'),
      description: 'Venda em dinheiro',
      sourceType: 'MANUAL',
      lines: [
        { chartOfAccountId: accountId, type: 'DEBIT', amount: 1000 },
        { chartOfAccountId: contraId, type: 'CREDIT', amount: 1000 },
      ],
    });

    // Create another entry within the period
    await journalEntriesRepository.create({
      tenantId: TENANT_ID,
      code: 'LC-000002',
      date: new Date('2024-01-20'),
      description: 'Pagamento de fornecedor',
      sourceType: 'MANUAL',
      lines: [
        { chartOfAccountId: contraId, type: 'DEBIT', amount: 200 },
        { chartOfAccountId: accountId, type: 'CREDIT', amount: 200 },
      ],
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      chartOfAccountId: accountId,
      from,
      to,
    });

    expect(result.account.id).toBe(accountId);
    expect(result.account.nature).toBe('DEBIT');
    expect(result.entries).toHaveLength(2);
    expect(result.totalDebits).toBe(1000);
    expect(result.totalCredits).toBe(200);
    expect(result.openingBalance).toBe(0);
    // For DEBIT nature: closingBalance = openingBalance + totalDebits - totalCredits
    expect(result.closingBalance).toBe(800);
  });

  it('should compute correct opening balance from prior entries', async () => {
    const account = await chartOfAccountsRepository.create({
      tenantId: TENANT_ID,
      code: '1.1.1',
      name: 'Caixa',
      type: 'ASSET',
      accountClass: 'CURRENT',
      nature: 'DEBIT',
    });

    const accountId = account.id.toString();
    journalEntriesRepository.chartOfAccounts.push({
      id: accountId,
      code: account.code,
      name: account.name,
      type: account.type,
      nature: account.nature,
    });

    const contraAccount = await chartOfAccountsRepository.create({
      tenantId: TENANT_ID,
      code: '3.1.1',
      name: 'Receitas',
      type: 'REVENUE',
      accountClass: 'INCOME',
      nature: 'CREDIT',
    });
    const contraId = contraAccount.id.toString();
    journalEntriesRepository.chartOfAccounts.push({
      id: contraId,
      code: contraAccount.code,
      name: contraAccount.name,
      type: contraAccount.type,
      nature: contraAccount.nature,
    });

    // Entry BEFORE the query period (creates prior balance)
    await journalEntriesRepository.create({
      tenantId: TENANT_ID,
      code: 'LC-000001',
      date: new Date('2023-12-15'),
      description: 'Saldo inicial',
      sourceType: 'MANUAL',
      lines: [
        { chartOfAccountId: accountId, type: 'DEBIT', amount: 5000 },
        { chartOfAccountId: contraId, type: 'CREDIT', amount: 5000 },
      ],
    });

    // Entry WITHIN the query period
    await journalEntriesRepository.create({
      tenantId: TENANT_ID,
      code: 'LC-000002',
      date: new Date('2024-01-10'),
      description: 'Venda em janeiro',
      sourceType: 'MANUAL',
      lines: [
        { chartOfAccountId: accountId, type: 'DEBIT', amount: 2000 },
        { chartOfAccountId: contraId, type: 'CREDIT', amount: 2000 },
      ],
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      chartOfAccountId: accountId,
      from: new Date('2024-01-01'),
      to: new Date('2024-01-31'),
    });

    // Opening balance should reflect the Dec 15 entry (5000 debit)
    expect(result.openingBalance).toBe(5000);
    expect(result.entries).toHaveLength(1);
    expect(result.totalDebits).toBe(2000);
    expect(result.totalCredits).toBe(0);
    // closingBalance = 5000 + 2000 - 0 = 7000
    expect(result.closingBalance).toBe(7000);
  });

  it('should return empty entries for account with no journal activity', async () => {
    const account = await chartOfAccountsRepository.create({
      tenantId: TENANT_ID,
      code: '1.1.2',
      name: 'Banco',
      type: 'ASSET',
      accountClass: 'CURRENT',
      nature: 'DEBIT',
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      chartOfAccountId: account.id.toString(),
      from: new Date('2024-01-01'),
      to: new Date('2024-01-31'),
    });

    expect(result.entries).toHaveLength(0);
    expect(result.openingBalance).toBe(0);
    expect(result.closingBalance).toBe(0);
    expect(result.totalDebits).toBe(0);
    expect(result.totalCredits).toBe(0);
  });

  it('should throw ResourceNotFoundError for invalid account', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        chartOfAccountId: 'non-existent-id',
        from: new Date('2024-01-01'),
        to: new Date('2024-01-31'),
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
