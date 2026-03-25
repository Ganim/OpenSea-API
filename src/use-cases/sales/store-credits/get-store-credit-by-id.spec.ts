import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryStoreCreditsRepository } from '@/repositories/sales/in-memory/in-memory-store-credits-repository';
import { makeStoreCredit } from '@/utils/tests/factories/sales/make-store-credit';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetStoreCreditByIdUseCase } from './get-store-credit-by-id';

let storeCreditsRepository: InMemoryStoreCreditsRepository;
let sut: GetStoreCreditByIdUseCase;

const tenantId = 'tenant-1';

describe('Get Store Credit By Id', () => {
  beforeEach(() => {
    storeCreditsRepository = new InMemoryStoreCreditsRepository();
    sut = new GetStoreCreditByIdUseCase(storeCreditsRepository);
  });

  it('should get a store credit by id', async () => {
    const storeCredit = makeStoreCredit({
      tenantId: new UniqueEntityID(tenantId),
      amount: 150,
    });
    storeCreditsRepository.items.push(storeCredit);

    const result = await sut.execute({
      tenantId,
      storeCreditId: storeCredit.id.toString(),
    });

    expect(result.storeCredit.id.toString()).toBe(storeCredit.id.toString());
    expect(result.storeCredit.amount).toBe(150);
  });

  it('should throw ResourceNotFoundError when credit does not exist', async () => {
    await expect(
      sut.execute({
        tenantId,
        storeCreditId: 'non-existing-id',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should not return a credit from another tenant', async () => {
    const storeCredit = makeStoreCredit({
      tenantId: new UniqueEntityID('other-tenant'),
    });
    storeCreditsRepository.items.push(storeCredit);

    await expect(
      sut.execute({
        tenantId,
        storeCreditId: storeCredit.id.toString(),
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
