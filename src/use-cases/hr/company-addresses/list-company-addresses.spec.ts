import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryCompanyAddressesRepository } from '@/repositories/hr/in-memory/in-memory-company-addresses-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateCompanyAddressUseCase } from './create-company-address';
import { ListCompanyAddressesUseCase } from './list-company-addresses';

let repository: InMemoryCompanyAddressesRepository;
let listUseCase: ListCompanyAddressesUseCase;
let createUseCase: CreateCompanyAddressUseCase;

describe('ListCompanyAddressesUseCase', () => {
  beforeEach(() => {
    repository = new InMemoryCompanyAddressesRepository();
    listUseCase = new ListCompanyAddressesUseCase(repository);
    createUseCase = new CreateCompanyAddressUseCase(repository);
  });

  it('should list addresses filtered by company', async () => {
    const companyId = new UniqueEntityID().toString();
    const otherCompanyId = new UniqueEntityID().toString();

    await createUseCase.execute({
      companyId,
      type: 'FISCAL',
      zip: '01234-567',
    });
    await createUseCase.execute({
      companyId,
      type: 'DELIVERY',
      zip: '01234-568',
    });
    await createUseCase.execute({
      companyId: otherCompanyId,
      type: 'FISCAL',
      zip: '99999-999',
    });

    const { addresses, total } = await listUseCase.execute({ companyId });

    expect(total).toBe(2);
    expect(
      addresses.every((addr) => addr.companyId.toString() === companyId),
    ).toBe(true);
  });

  it('should filter by type', async () => {
    const companyId = new UniqueEntityID().toString();

    await createUseCase.execute({
      companyId,
      type: 'FISCAL',
      zip: '01234-567',
    });
    await createUseCase.execute({
      companyId,
      type: 'DELIVERY',
      zip: '01234-568',
    });

    const { addresses, total } = await listUseCase.execute({
      companyId,
      type: 'DELIVERY',
    });

    expect(total).toBe(1);
    expect(addresses[0].type).toBe('DELIVERY');
  });
});
