import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryStoreCreditsRepository } from '@/repositories/sales/in-memory/in-memory-store-credits-repository';
import { makeStoreCredit } from '@/utils/tests/factories/sales/make-store-credit';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeleteStoreCreditUseCase } from './delete-store-credit';

let storeCreditsRepository: InMemoryStoreCreditsRepository;
let sut: DeleteStoreCreditUseCase;

const tenantId = 'tenant-1';

describe('Delete Store Credit', () => {
  beforeEach(() => {
    storeCreditsRepository = new InMemoryStoreCreditsRepository();
    sut = new DeleteStoreCreditUseCase(storeCreditsRepository);
  });

  it('should delete a store credit', async () => {
    const storeCredit = makeStoreCredit({
      tenantId: new UniqueEntityID(tenantId),
      amount: 100,
    });
    storeCreditsRepository.items.push(storeCredit);

    const result = await sut.execute({
      tenantId,
      storeCreditId: storeCredit.id.toString(),
    });

    expect(result.deletedStoreCredit.id.toString()).toBe(
      storeCredit.id.toString(),
    );
    expect(storeCreditsRepository.items).toHaveLength(0);
  });

  it('should throw ResourceNotFoundError when credit does not exist', async () => {
    await expect(
      sut.execute({
        tenantId,
        storeCreditId: 'non-existing-id',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should not delete a credit from another tenant', async () => {
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

    expect(storeCreditsRepository.items).toHaveLength(1);
  });
});
