import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryBankAccountsRepository } from '@/repositories/finance/in-memory/in-memory-bank-accounts-repository';
import { InMemoryBankConnectionsRepository } from '@/repositories/finance/in-memory/in-memory-bank-connections-repository';
import type { BankingProvider } from '@/services/banking/pluggy-provider.interface';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConnectBankUseCase } from './connect-bank';

let bankAccountsRepository: InMemoryBankAccountsRepository;
let bankConnectionsRepository: InMemoryBankConnectionsRepository;
let mockBankingProvider: BankingProvider;
let sut: ConnectBankUseCase;

describe('ConnectBankUseCase', () => {
  beforeEach(() => {
    bankAccountsRepository = new InMemoryBankAccountsRepository();
    bankConnectionsRepository = new InMemoryBankConnectionsRepository();
    mockBankingProvider = {
      providerName: 'PLUGGY',
      createConnectToken: vi.fn(),
      getItem: vi.fn().mockResolvedValue({
        id: 'item-123',
        status: 'UPDATED',
        executionStatus: 'SUCCESS',
        connector: { id: 1, name: 'Banco do Brasil', institutionUrl: '', imageUrl: '' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
      getAccounts: vi.fn(),
      getTransactions: vi.fn(),
    };

    sut = new ConnectBankUseCase(
      bankAccountsRepository,
      bankConnectionsRepository,
      mockBankingProvider,
    );
  });

  it('should create a bank connection', async () => {
    const bankAccount = await bankAccountsRepository.create({
      tenantId: 'tenant-1',
      name: 'Conta BB',
      bankCode: '001',
      agency: '1234',
      accountNumber: '56789',
      accountType: 'CHECKING',
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      bankAccountId: bankAccount.id.toString(),
      externalItemId: 'item-123',
    });

    expect(result.connection.status).toBe('ACTIVE');
    expect(result.connection.bankAccountId).toBe(bankAccount.id.toString());
    expect(result.connection.externalItemId).toBe('item-123');
  });

  it('should reject when bank account not found', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        bankAccountId: 'non-existent',
        externalItemId: 'item-123',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should reject duplicate connection', async () => {
    const bankAccount = await bankAccountsRepository.create({
      tenantId: 'tenant-1',
      name: 'Conta BB',
      bankCode: '001',
      agency: '1234',
      accountNumber: '56789',
      accountType: 'CHECKING',
    });

    await bankConnectionsRepository.create({
      tenantId: 'tenant-1',
      bankAccountId: bankAccount.id.toString(),
      externalItemId: 'existing-item',
      accessToken: 'token',
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        bankAccountId: bankAccount.id.toString(),
        externalItemId: 'item-123',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should reject when provider reports login error', async () => {
    const bankAccount = await bankAccountsRepository.create({
      tenantId: 'tenant-1',
      name: 'Conta BB',
      bankCode: '001',
      agency: '1234',
      accountNumber: '56789',
      accountType: 'CHECKING',
    });

    (mockBankingProvider.getItem as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'item-123',
      status: 'LOGIN_ERROR',
      executionStatus: 'ERROR',
      connector: { id: 1, name: 'Banco do Brasil', institutionUrl: '', imageUrl: '' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        bankAccountId: bankAccount.id.toString(),
        externalItemId: 'item-123',
      }),
    ).rejects.toThrow(BadRequestError);
  });
});
