import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryCompanyAddressesRepository } from '@/repositories/hr/in-memory/in-memory-company-addresses-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateCompanyAddressUseCase } from './create-company-address';
import { UpdateCompanyAddressUseCase } from './update-company-address';

let repository: InMemoryCompanyAddressesRepository;
let createUseCase: CreateCompanyAddressUseCase;
let updateUseCase: UpdateCompanyAddressUseCase;

describe('UpdateCompanyAddressUseCase', () => {
  beforeEach(() => {
    repository = new InMemoryCompanyAddressesRepository();
    createUseCase = new CreateCompanyAddressUseCase(repository);
    updateUseCase = new UpdateCompanyAddressUseCase(repository);
  });

  it('should update address fields and recompute pending issues', async () => {
    const companyId = new UniqueEntityID().toString();
    const { address } = await createUseCase.execute({
      companyId,
      zip: '01234-567',
    });

    const result = await updateUseCase.execute({
      companyId,
      addressId: address.id.toString(),
      street: 'Rua Nova',
      city: 'São Paulo',
      state: 'SP',
      ibgeCityCode: '3550308',
    });

    expect(result.address?.street).toBe('Rua Nova');
    expect(result.address?.pendingIssues.includes('street')).toBe(false);
  });

  it('should avoid duplicate type when updating', async () => {
    const companyId = new UniqueEntityID().toString();

    await createUseCase.execute({
      companyId,
      type: 'FISCAL',
      zip: '01234-567',
    });
    const second = await createUseCase.execute({
      companyId,
      type: 'DELIVERY',
      zip: '01234-568',
    });

    await expect(
      updateUseCase.execute({
        companyId,
        addressId: second.address.id.toString(),
        type: 'FISCAL',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);

    const stored = await repository.findById(second.address.id, {
      companyId: new UniqueEntityID(companyId),
    });
    expect(stored?.type).toBe('DELIVERY');
  });
});
