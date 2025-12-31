import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryCompanyAddressesRepository } from '@/repositories/hr/in-memory/in-memory-company-addresses-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateCompanyAddressUseCase } from './create-company-address';
import { GetPrimaryCompanyAddressUseCase } from './get-primary-company-address';

let repository: InMemoryCompanyAddressesRepository;
let createUseCase: CreateCompanyAddressUseCase;
let primaryUseCase: GetPrimaryCompanyAddressUseCase;

describe('GetPrimaryCompanyAddressUseCase', () => {
  beforeEach(() => {
    repository = new InMemoryCompanyAddressesRepository();
    createUseCase = new CreateCompanyAddressUseCase(repository);
    primaryUseCase = new GetPrimaryCompanyAddressUseCase(repository);
  });

  it('should return the primary address for a type', async () => {
    const companyId = new UniqueEntityID().toString();

    await createUseCase.execute({
      companyId,
      type: 'DELIVERY',
      zip: '01234-567',
      isPrimary: true,
    });

    await createUseCase.execute({
      companyId,
      type: 'FISCAL',
      zip: '76543-210',
      isPrimary: false,
    });

    const { address } = await primaryUseCase.execute({
      companyId,
      type: 'DELIVERY',
    });

    expect(address).not.toBeNull();
    expect(address?.isPrimary).toBe(true);
  });
});
