import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryBankAccountsRepository } from '@/repositories/finance/in-memory/in-memory-bank-accounts-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateBankAccountUseCase } from './update-bank-account';

let repository: InMemoryBankAccountsRepository;
let sut: UpdateBankAccountUseCase;

describe('UpdateBankAccountUseCase', () => {
  beforeEach(() => {
    repository = new InMemoryBankAccountsRepository();
    sut = new UpdateBankAccountUseCase(repository);
  });

  it('should update a bank account name', async () => {
    const bankAccount = await repository.create({
      tenantId: 'tenant-1',
      companyId: 'company-1',
      name: 'Conta Principal',
      bankCode: '001',
      agency: '1234',
      accountNumber: '12345-6',
      accountType: 'CHECKING',
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      id: bankAccount.id.toString(),
      name: 'Conta Atualizada',
    });

    expect(result.bankAccount).toBeDefined();
    expect(result.bankAccount.name).toBe('Conta Atualizada');
    expect(result.bankAccount.id).toBe(bankAccount.id.toString());
  });

  it('should throw ResourceNotFoundError if bank account not found', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        id: 'non-existent-id',
        name: 'New Name',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw BadRequestError if name is empty', async () => {
    const bankAccount = await repository.create({
      tenantId: 'tenant-1',
      companyId: 'company-1',
      name: 'Conta Principal',
      bankCode: '001',
      agency: '1234',
      accountNumber: '12345-6',
      accountType: 'CHECKING',
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        id: bankAccount.id.toString(),
        name: '',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
