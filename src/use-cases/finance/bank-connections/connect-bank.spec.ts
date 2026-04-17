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
        connector: {
          id: 1,
          name: 'Banco do Brasil',
          institutionUrl: '',
          imageUrl: '',
        },
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

  // P2-13: cap active connections per tenant so one account can't fan-out
  // to the banking provider beyond a sane SMB ceiling.
  it('should reject when tenant already has 10 active bank connections', async () => {
    // Seed 10 ACTIVE connections on other bank accounts for tenant-1
    for (let i = 0; i < 10; i++) {
      await bankConnectionsRepository.create({
        tenantId: 'tenant-1',
        bankAccountId: `other-account-${i}`,
        externalItemId: `item-${i}`,
        accessToken: `token-${i}`,
      });
    }

    // An 11th bank account tries to connect — should fail at the limit
    const bankAccount = await bankAccountsRepository.create({
      tenantId: 'tenant-1',
      name: 'Conta extra',
      bankCode: '001',
      agency: '1234',
      accountNumber: '11111',
      accountType: 'CHECKING',
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        bankAccountId: bankAccount.id.toString(),
        externalItemId: 'item-new',
      }),
    ).rejects.toThrow(/Limite de 10 conexões bancárias ativas/);
  });

  it('should NOT count other tenants toward the 10-connection limit', async () => {
    // Seed 10 ACTIVE connections for tenant-2
    for (let i = 0; i < 10; i++) {
      await bankConnectionsRepository.create({
        tenantId: 'tenant-2',
        bankAccountId: `tenant2-account-${i}`,
        externalItemId: `t2-item-${i}`,
        accessToken: `t2-token-${i}`,
      });
    }

    const bankAccount = await bankAccountsRepository.create({
      tenantId: 'tenant-1',
      name: 'Conta tenant-1',
      bankCode: '001',
      agency: '1234',
      accountNumber: '22222',
      accountType: 'CHECKING',
    });

    // tenant-1 still has 0 active connections → must succeed
    const result = await sut.execute({
      tenantId: 'tenant-1',
      bankAccountId: bankAccount.id.toString(),
      externalItemId: 'item-ok',
    });

    expect(result.connection.status).toBe('ACTIVE');
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

    (mockBankingProvider.getItem as ReturnType<typeof vi.fn>).mockResolvedValue(
      {
        id: 'item-123',
        status: 'LOGIN_ERROR',
        executionStatus: 'ERROR',
        connector: {
          id: 1,
          name: 'Banco do Brasil',
          institutionUrl: '',
          imageUrl: '',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    );

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        bankAccountId: bankAccount.id.toString(),
        externalItemId: 'item-123',
      }),
    ).rejects.toThrow(BadRequestError);
  });
});
