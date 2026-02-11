import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryBankAccountsRepository } from '@/repositories/finance/in-memory/in-memory-bank-accounts-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeleteBankAccountUseCase } from './delete-bank-account';

let repository: InMemoryBankAccountsRepository;
let sut: DeleteBankAccountUseCase;

describe('DeleteBankAccountUseCase', () => {
  beforeEach(() => {
    repository = new InMemoryBankAccountsRepository();
    sut = new DeleteBankAccountUseCase(repository);
  });

  it('should delete a bank account', async () => {
    const bankAccount = await repository.create({
      tenantId: 'tenant-1',
      companyId: 'company-1',
      name: 'Conta Principal',
      bankCode: '001',
      agency: '1234',
      accountNumber: '12345-6',
      accountType: 'CHECKING',
    });

    await sut.execute({
      tenantId: 'tenant-1',
      id: bankAccount.id.toString(),
    });

    const deletedAccount = await repository.findById(
      bankAccount.id,
      'tenant-1',
    );
    expect(deletedAccount).toBeNull();
  });

  it('should throw ResourceNotFoundError if bank account not found', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        id: 'non-existent-id',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
