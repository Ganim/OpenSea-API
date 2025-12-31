import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryCompanyAddressesRepository } from '@/repositories/hr/in-memory/in-memory-company-addresses-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateCompanyAddressUseCase } from './create-company-address';
import { GetCompanyAddressUseCase } from './get-company-address';

let repository: InMemoryCompanyAddressesRepository;
let getUseCase: GetCompanyAddressUseCase;
let createUseCase: CreateCompanyAddressUseCase;

describe('GetCompanyAddressUseCase', () => {
  beforeEach(() => {
    repository = new InMemoryCompanyAddressesRepository();
    getUseCase = new GetCompanyAddressUseCase(repository);
    createUseCase = new CreateCompanyAddressUseCase(repository);
  });

  it('should return an address by id', async () => {
    const companyId = new UniqueEntityID().toString();
    const { address } = await createUseCase.execute({
      companyId,
      type: 'FISCAL',
      zip: '01234-567',
    });

    const result = await getUseCase.execute({
      companyId,
      addressId: address.id.toString(),
    });

    expect(result.address?.id.toString()).toBe(address.id.toString());
  });

  it('should return null when address does not belong to company', async () => {
    const companyA = new UniqueEntityID().toString();
    const companyB = new UniqueEntityID().toString();

    const { address } = await createUseCase.execute({
      companyId: companyA,
      type: 'DELIVERY',
      zip: '01234-567',
    });

    const result = await getUseCase.execute({
      companyId: companyB,
      addressId: address.id.toString(),
    });

    expect(result.address).toBeNull();
  });
});
