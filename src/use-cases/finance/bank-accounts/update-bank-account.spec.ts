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

  // P2-47: accountType and accountNumber are immutable — mutating them
  // would orphan historical payments and misalign the linked bank
  // connection's external account.
  it('should reject changes to accountType', async () => {
    const bankAccount = await repository.create({
      tenantId: 'tenant-1',
      name: 'Conta Corrente',
      bankCode: '001',
      agency: '1234',
      accountNumber: '12345-6',
      accountType: 'CHECKING',
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        id: bankAccount.id.toString(),
        accountType: 'SAVINGS',
      }),
    ).rejects.toThrow(/accountType é imutável/);
  });

  it('should reject changes to accountNumber', async () => {
    const bankAccount = await repository.create({
      tenantId: 'tenant-1',
      name: 'Conta Corrente',
      bankCode: '001',
      agency: '1234',
      accountNumber: '12345-6',
      accountType: 'CHECKING',
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        id: bankAccount.id.toString(),
        accountNumber: '99999-9',
      }),
    ).rejects.toThrow(/accountNumber é imutável/);
  });

  it('should accept the same accountType/accountNumber (no-op passthrough)', async () => {
    const bankAccount = await repository.create({
      tenantId: 'tenant-1',
      name: 'Conta Corrente',
      bankCode: '001',
      agency: '1234',
      accountNumber: '12345-6',
      accountType: 'CHECKING',
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      id: bankAccount.id.toString(),
      accountType: 'CHECKING',
      accountNumber: '12345-6',
      name: 'Conta Corrente Principal',
    });

    expect(result.bankAccount.name).toBe('Conta Corrente Principal');
  });
});
