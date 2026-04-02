vi.mock('@/lib/prisma', () => ({
  prisma: {
    bankAccount: {
      update: vi.fn(),
    },
  },
}));

import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { prisma } from '@/lib/prisma';
import { InMemoryBankAccountsRepository } from '@/repositories/finance/in-memory/in-memory-bank-accounts-repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UpdateBankAccountApiConfigUseCase } from './update-bank-account-api-config';

let bankAccountsRepository: InMemoryBankAccountsRepository;
let sut: UpdateBankAccountApiConfigUseCase;

describe('UpdateBankAccountApiConfigUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    bankAccountsRepository = new InMemoryBankAccountsRepository();
    sut = new UpdateBankAccountApiConfigUseCase(bankAccountsRepository);
  });

  it('should update API config and return bank account DTO', async () => {
    const account = await bankAccountsRepository.create({
      tenantId: 'tenant-1',
      name: 'Conta Corrente',
      bankCode: '756',
      bankName: 'Sicoob',
      agency: '3456',
      accountNumber: '123456',
      accountType: 'CHECKING',
      isDefault: false,
    });

    vi.mocked(prisma.bankAccount.update).mockResolvedValue({} as never);

    const result = await sut.execute({
      tenantId: 'tenant-1',
      bankAccountId: account.id.toString(),
      apiProvider: 'SICOOB',
      apiClientId: 'client-123',
      apiCertFileId: 'cert-file',
      apiCertKeyFileId: 'cert-key-file',
      apiScopes: 'cob.read cob.write',
      apiWebhookSecret: 'webhook-secret',
      apiEnabled: true,
    });

    expect(result.bankAccount).toBeDefined();
    expect(result.bankAccount.id).toBe(account.id.toString());
    expect(result.bankAccount.name).toBe('Conta Corrente');
    expect(vi.mocked(prisma.bankAccount.update)).toHaveBeenCalledWith({
      where: { id: account.id.toString(), tenantId: 'tenant-1' },
      data: {
        apiProvider: 'SICOOB',
        apiClientId: 'client-123',
        apiCertFileId: 'cert-file',
        apiCertKeyFileId: 'cert-key-file',
        apiScopes: 'cob.read cob.write',
        apiWebhookSecret: 'webhook-secret',
        apiEnabled: true,
      },
    });
  });

  it('should set optional fields to null when not provided', async () => {
    const account = await bankAccountsRepository.create({
      tenantId: 'tenant-1',
      name: 'Conta',
      bankCode: '756',
      bankName: 'Sicoob',
      agency: '3456',
      accountNumber: '123456',
      accountType: 'CHECKING',
      isDefault: false,
    });

    vi.mocked(prisma.bankAccount.update).mockResolvedValue({} as never);

    await sut.execute({
      tenantId: 'tenant-1',
      bankAccountId: account.id.toString(),
      apiProvider: 'SICOOB',
      apiClientId: 'client-123',
      apiEnabled: false,
    });

    expect(vi.mocked(prisma.bankAccount.update)).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          apiCertFileId: null,
          apiCertKeyFileId: null,
          apiScopes: null,
          apiWebhookSecret: null,
        }),
      }),
    );
  });

  it('should throw ResourceNotFoundError when bank account does not exist', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        bankAccountId: 'non-existent',
        apiProvider: 'SICOOB',
        apiClientId: 'client-123',
        apiEnabled: true,
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
