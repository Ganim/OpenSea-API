vi.mock('@/lib/prisma', () => ({
  prisma: {
    bankAccount: {
      findUnique: vi.fn(),
    },
  },
}));

import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { prisma } from '@/lib/prisma';
import { InMemoryBankAccountsRepository } from '@/repositories/finance/in-memory/in-memory-bank-accounts-repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GetBankAccountBalanceUseCase } from './get-bank-account-balance';

let bankAccountsRepository: InMemoryBankAccountsRepository;
let sut: GetBankAccountBalanceUseCase;

const mockAuthenticate = vi.fn();
const mockGetBalance = vi.fn();
const mockGetBankingProvider = vi.fn();

describe('GetBankAccountBalanceUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    bankAccountsRepository = new InMemoryBankAccountsRepository();
    mockGetBankingProvider.mockResolvedValue({
      authenticate: mockAuthenticate,
      getBalance: mockGetBalance,
    });
    sut = new GetBankAccountBalanceUseCase(
      bankAccountsRepository,
      mockGetBankingProvider,
    );
  });

  it('should return balance for a valid bank account with API enabled', async () => {
    const account = await bankAccountsRepository.create({
      tenantId: 'tenant-1',
      name: 'Conta Corrente',
      bankCode: '756',
      bankName: 'Sicoob',
      agency: '3456',
      accountNumber: '123456',
      accountType: 'CHECKING',
      isDefault: false,
      apiEnabled: true,
    });

    const accountId = account.id.toString();

    vi.mocked(prisma.bankAccount.findUnique).mockResolvedValue({
      apiEnabled: true,
      accountNumber: '123456',
    } as never);

    const expectedBalance = { available: 1000, blocked: 0, scheduled: 200 };
    mockGetBalance.mockResolvedValue(expectedBalance);

    const result = await sut.execute({
      tenantId: 'tenant-1',
      bankAccountId: accountId,
    });

    expect(result.balance).toEqual(expectedBalance);
    expect(mockAuthenticate).toHaveBeenCalled();
    expect(mockGetBalance).toHaveBeenCalledWith('123456');
  });

  it('should throw ResourceNotFoundError when bank account does not exist', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        bankAccountId: 'non-existent',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should throw BadRequestError when API is not enabled', async () => {
    const account = await bankAccountsRepository.create({
      tenantId: 'tenant-1',
      name: 'Conta',
      bankCode: '756',
      bankName: 'Sicoob',
      agency: '3456',
      accountNumber: '123456',
      accountType: 'CHECKING',
      isDefault: false,
      apiEnabled: false,
    });

    vi.mocked(prisma.bankAccount.findUnique).mockResolvedValue({
      apiEnabled: false,
      accountNumber: '123456',
    } as never);

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        bankAccountId: account.id.toString(),
      }),
    ).rejects.toThrow(BadRequestError);
  });
});
