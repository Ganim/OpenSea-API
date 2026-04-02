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
import { GetBankAccountHealthUseCase } from './get-bank-account-health';

let bankAccountsRepository: InMemoryBankAccountsRepository;
let sut: GetBankAccountHealthUseCase;

const mockHealthCheck = vi.fn();
const mockGetBankingProvider = vi.fn();

describe('GetBankAccountHealthUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    bankAccountsRepository = new InMemoryBankAccountsRepository();
    mockGetBankingProvider.mockResolvedValue({
      healthCheck: mockHealthCheck,
    });
    sut = new GetBankAccountHealthUseCase(
      bankAccountsRepository,
      mockGetBankingProvider,
    );
  });

  it('should return health check for a valid bank account with API enabled', async () => {
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

    vi.mocked(prisma.bankAccount.findUnique).mockResolvedValue({
      apiEnabled: true,
      accountNumber: '123456',
    } as never);

    const expectedHealth = { status: 'healthy', latencyMs: 150 };
    mockHealthCheck.mockResolvedValue(expectedHealth);

    const result = await sut.execute({
      tenantId: 'tenant-1',
      bankAccountId: account.id.toString(),
    });

    expect(result.health).toEqual(expectedHealth);
    expect(mockHealthCheck).toHaveBeenCalledWith('123456');
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

  it('should throw ResourceNotFoundError when account belongs to different tenant', async () => {
    await bankAccountsRepository.create({
      tenantId: 'tenant-other',
      name: 'Conta',
      bankCode: '756',
      bankName: 'Sicoob',
      agency: '3456',
      accountNumber: '123456',
      accountType: 'CHECKING',
      isDefault: false,
    });

    const account = bankAccountsRepository.items[0];

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        bankAccountId: account.id.toString(),
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
