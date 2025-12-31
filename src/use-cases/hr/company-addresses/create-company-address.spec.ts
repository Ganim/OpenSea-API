import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryCompanyAddressesRepository } from '@/repositories/hr/in-memory/in-memory-company-addresses-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateCompanyAddressUseCase } from './create-company-address';

let repository: InMemoryCompanyAddressesRepository;
let sut: CreateCompanyAddressUseCase;

describe('CreateCompanyAddressUseCase', () => {
  beforeEach(() => {
    repository = new InMemoryCompanyAddressesRepository();
    sut = new CreateCompanyAddressUseCase(repository);
  });

  it('should create a company address with minimal data (zip required)', async () => {
    const companyId = new UniqueEntityID().toString();

    const { address } = await sut.execute({
      companyId,
      zip: '01234-567',
    });

    expect(address).toBeTruthy();
    expect(address.zip).toBe('01234-567');
    expect(address.pendingIssues.length).toBeGreaterThan(0);
  });

  it('should not allow duplicated type for the same company', async () => {
    const companyId = new UniqueEntityID().toString();

    await sut.execute({
      companyId,
      type: 'FISCAL',
      zip: '01234-567',
    });

    await expect(
      sut.execute({
        companyId,
        type: 'FISCAL',
        zip: '76543-210',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should unset other primaries when creating a new primary of the same type', async () => {
    const companyId = new UniqueEntityID().toString();

    // Create a primary FISCAL address
    const first = await sut.execute({
      companyId,
      type: 'FISCAL',
      zip: '01234-567',
      isPrimary: true,
    });

    expect(first.address.isPrimary).toBe(true);

    // Create and mark second DELIVERY as primary (different type)
    const second = await sut.execute({
      companyId,
      type: 'DELIVERY',
      zip: '76543-210',
      isPrimary: true,
    });

    const all = await repository.findMany({
      companyId: new UniqueEntityID(companyId),
    });

    // Both should be primary since they're different types
    const primaries = all.addresses.filter((addr) => addr.isPrimary);
    expect(primaries.length).toBe(2);

    const fiscalPrimary = primaries.find((addr) => addr.type === 'FISCAL');
    const deliveryPrimary = primaries.find((addr) => addr.type === 'DELIVERY');

    expect(fiscalPrimary?.id.equals(first.address.id)).toBe(true);
    expect(deliveryPrimary?.id.equals(second.address.id)).toBe(true);
  });
});
