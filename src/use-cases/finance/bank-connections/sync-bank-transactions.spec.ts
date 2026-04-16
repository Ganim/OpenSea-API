import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SyncBankTransactionsUseCase } from './sync-bank-transactions';
import { InMemoryBankConnectionsRepository } from '@/repositories/finance/in-memory/in-memory-bank-connections-repository';
import { InMemoryBankReconciliationsRepository } from '@/repositories/finance/in-memory/in-memory-bank-reconciliations-repository';
import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { BankingProvider as PluggyProvider } from '@/services/banking/pluggy-provider.interface';

function makePluggyProviderMock(): PluggyProvider {
  return {
    providerName: 'pluggy-mock',
    createConnectToken: vi.fn(),
    getItem: vi.fn(),
    getAccounts: vi.fn().mockResolvedValue([
      {
        id: 'account-1',
        itemId: 'item-1',
        type: 'BANK',
        subtype: 'CHECKING',
        name: 'Conta Corrente',
        number: '12345',
        balance: 10000,
        currencyCode: 'BRL',
      },
    ]),
    getTransactions: vi.fn().mockResolvedValue([
      {
        id: 'tx-1',
        accountId: 'account-1',
        date: new Date().toISOString().split('T')[0],
        description: 'Pagamento Fornecedor ABC',
        amount: -500,
        type: 'DEBIT',
      },
      {
        id: 'tx-2',
        accountId: 'account-1',
        date: new Date().toISOString().split('T')[0],
        description: 'Recebimento Cliente XYZ',
        amount: 1000,
        type: 'CREDIT',
      },
    ]),
  };
}

describe('SyncBankTransactionsUseCase', () => {
  let bankConnectionsRepo: InMemoryBankConnectionsRepository;
  let bankReconciliationsRepo: InMemoryBankReconciliationsRepository;
  let financeEntriesRepo: InMemoryFinanceEntriesRepository;
  let pluggyProvider: PluggyProvider;
  let sut: SyncBankTransactionsUseCase;

  beforeEach(() => {
    bankConnectionsRepo = new InMemoryBankConnectionsRepository();
    bankReconciliationsRepo = new InMemoryBankReconciliationsRepository();
    financeEntriesRepo = new InMemoryFinanceEntriesRepository();
    pluggyProvider = makePluggyProviderMock();
    sut = new SyncBankTransactionsUseCase(
      bankConnectionsRepo,
      bankReconciliationsRepo,
      financeEntriesRepo,
      pluggyProvider,
    );
  });

  it('should sync transactions and return correct counts', async () => {
    const connection = await bankConnectionsRepo.create({
      tenantId: 'tenant-1',
      bankAccountId: 'bank-account-1',
      externalItemId: 'external-item-1',
      accessToken: 'access-token-abc',
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      connectionId: connection.id,
    });

    expect(result.transactionsImported).toBe(2);
    expect(result.connection).toBeDefined();
    expect(result.connection.lastSyncAt).not.toBeNull();
  });

  it('should create reconciliation records with correct transaction data', async () => {
    const connection = await bankConnectionsRepo.create({
      tenantId: 'tenant-1',
      bankAccountId: 'bank-account-1',
      externalItemId: 'external-item-1',
      accessToken: 'access-token-abc',
    });

    await sut.execute({
      tenantId: 'tenant-1',
      connectionId: connection.id,
    });

    expect(bankReconciliationsRepo.reconciliations).toHaveLength(1);
    const reconciliation = bankReconciliationsRepo.reconciliations[0];
    expect(reconciliation.totalTransactions).toBe(2);
    expect(bankReconciliationsRepo.items).toHaveLength(2);
  });

  it('should throw ResourceNotFoundError when connection does not exist', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        connectionId: 'non-existent-id',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should not throw when bankAccountId does not match tenant', async () => {
    const connection = await bankConnectionsRepo.create({
      tenantId: 'tenant-1',
      bankAccountId: 'bank-account-1',
      externalItemId: 'external-item-1',
      accessToken: 'access-token-abc',
    });

    // Different tenant — should fail with ResourceNotFoundError
    await expect(
      sut.execute({
        tenantId: 'tenant-2',
        connectionId: connection.id,
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should update lastSyncAt on connection even when no accounts', async () => {
    // Override to return empty accounts
    vi.mocked(pluggyProvider.getAccounts).mockResolvedValueOnce([]);

    const connection = await bankConnectionsRepo.create({
      tenantId: 'tenant-1',
      bankAccountId: 'bank-account-1',
      externalItemId: 'external-item-1',
      accessToken: 'access-token-abc',
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      connectionId: connection.id,
    });

    expect(result.transactionsImported).toBe(0);
    expect(result.matchedCount).toBe(0);
    expect(result.connection.lastSyncAt).not.toBeNull();
  });

  it('should skip accounts with zero transactions', async () => {
    // Two accounts but both return empty transactions
    vi.mocked(pluggyProvider.getAccounts).mockResolvedValueOnce([
      {
        id: 'account-1',
        itemId: 'item-1',
        type: 'BANK',
        subtype: 'CHECKING',
        name: 'Checking',
        number: '1',
        balance: 0,
        currencyCode: 'BRL',
      },
      {
        id: 'account-2',
        itemId: 'item-1',
        type: 'BANK',
        subtype: 'SAVINGS',
        name: 'Savings',
        number: '2',
        balance: 0,
        currencyCode: 'BRL',
      },
    ]);
    vi.mocked(pluggyProvider.getTransactions).mockResolvedValue([]);

    const connection = await bankConnectionsRepo.create({
      tenantId: 'tenant-1',
      bankAccountId: 'bank-account-1',
      externalItemId: 'external-item-1',
      accessToken: 'access-token-abc',
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      connectionId: connection.id,
    });

    expect(result.transactionsImported).toBe(0);
    expect(bankReconciliationsRepo.reconciliations).toHaveLength(0);
  });

  it('should call getTransactions with 30-day date range', async () => {
    const connection = await bankConnectionsRepo.create({
      tenantId: 'tenant-1',
      bankAccountId: 'bank-account-1',
      externalItemId: 'external-item-1',
      accessToken: 'access-token-abc',
    });

    await sut.execute({
      tenantId: 'tenant-1',
      connectionId: connection.id,
    });

    expect(pluggyProvider.getTransactions).toHaveBeenCalledWith(
      'account-1',
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
    );

    const [, fromDate, toDate] = vi.mocked(pluggyProvider.getTransactions).mock
      .calls[0];
    const from = new Date(fromDate);
    const to = new Date(toDate);
    const diffDays = Math.round(
      (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24),
    );
    expect(diffDays).toBe(30);
  });

  it('should store DEBIT transactions with positive amount so auto-match can pair them with PAYABLE entries', async () => {
    // Pluggy returns amount=-500 for debits; if the repo stored -500, auto-match
    // would compare -500 against entry.expectedAmount=500 and never match.
    const today = new Date();
    vi.mocked(pluggyProvider.getTransactions).mockResolvedValueOnce([
      {
        id: 'pluggy-tx-debit',
        accountId: 'account-1',
        date: today.toISOString().split('T')[0],
        description: 'Pagamento Fornecedor ACME',
        amount: -500,
        type: 'DEBIT',
      },
    ]);

    await financeEntriesRepo.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-MATCH',
      description: 'Pagamento Fornecedor ACME',
      categoryId: 'cat-1',
      expectedAmount: 500,
      supplierName: 'ACME',
      bankAccountId: 'bank-account-1',
      issueDate: today,
      dueDate: today,
    });

    const connection = await bankConnectionsRepo.create({
      tenantId: 'tenant-1',
      bankAccountId: 'bank-account-1',
      externalItemId: 'external-item-1',
      accessToken: 'access-token-abc',
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      connectionId: connection.id,
    });

    // Stored amount must be absolute so amount comparison works
    const storedItem = bankReconciliationsRepo.items[0];
    expect(storedItem.amount).toBe(500);
    expect(storedItem.type).toBe('DEBIT');

    // And auto-match should have paired the debit with the PAYABLE entry
    expect(result.matchedCount).toBe(1);
  });
});
