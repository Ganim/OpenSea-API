import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryCompanyAddressesRepository } from '@/repositories/hr/in-memory/in-memory-company-addresses-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateCompanyAddressUseCase } from './create-company-address';
import { DeleteCompanyAddressUseCase } from './delete-company-address';
import { GetCompanyAddressUseCase } from './get-company-address';

let repository: InMemoryCompanyAddressesRepository;
let createUseCase: CreateCompanyAddressUseCase;
let deleteUseCase: DeleteCompanyAddressUseCase;
let getUseCase: GetCompanyAddressUseCase;

describe('DeleteCompanyAddressUseCase', () => {
  beforeEach(() => {
    repository = new InMemoryCompanyAddressesRepository();
    createUseCase = new CreateCompanyAddressUseCase(repository);
    deleteUseCase = new DeleteCompanyAddressUseCase(repository);
    getUseCase = new GetCompanyAddressUseCase(repository);
  });

  it('should soft delete an address', async () => {
    const companyId = new UniqueEntityID().toString();
    const { address } = await createUseCase.execute({
      companyId,
      zip: '01234-567',
    });

    await deleteUseCase.execute({
      companyId,
      addressId: address.id.toString(),
    });

    const { address: deleted } = await getUseCase.execute({
      companyId,
      addressId: address.id.toString(),
    });

    expect(deleted).toBeNull();

    const { address: withDeleted } = await getUseCase.execute({
      companyId,
      addressId: address.id.toString(),
      includeDeleted: true,
    });

    expect(withDeleted?.deletedAt).toBeInstanceOf(Date);
  });
});
