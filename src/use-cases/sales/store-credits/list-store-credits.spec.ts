import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryStoreCreditsRepository } from '@/repositories/sales/in-memory/in-memory-store-credits-repository';
import { makeStoreCredit } from '@/utils/tests/factories/sales/make-store-credit';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListStoreCreditsUseCase } from './list-store-credits';

let storeCreditsRepository: InMemoryStoreCreditsRepository;
let sut: ListStoreCreditsUseCase;

const tenantId = 'tenant-1';

describe('List Store Credits', () => {
  beforeEach(() => {
    storeCreditsRepository = new InMemoryStoreCreditsRepository();
    sut = new ListStoreCreditsUseCase(storeCreditsRepository);
  });

  it('should list store credits with pagination', async () => {
    const customerId = new UniqueEntityID();

    for (let i = 0; i < 25; i++) {
      storeCreditsRepository.items.push(
        makeStoreCredit({
          tenantId: new UniqueEntityID(tenantId),
          customerId,
          amount: 10 + i,
        }),
      );
    }

    const result = await sut.execute({ tenantId, page: 1, limit: 20 });

    expect(result.storeCredits).toHaveLength(20);
    expect(result.meta.total).toBe(25);
    expect(result.meta.page).toBe(1);
    expect(result.meta.limit).toBe(20);
    expect(result.meta.pages).toBe(2);
  });

  it('should filter by customerId', async () => {
    const customerA = new UniqueEntityID();
    const customerB = new UniqueEntityID();

    storeCreditsRepository.items.push(
      makeStoreCredit({
        tenantId: new UniqueEntityID(tenantId),
        customerId: customerA,
        amount: 100,
      }),
      makeStoreCredit({
        tenantId: new UniqueEntityID(tenantId),
        customerId: customerA,
        amount: 50,
      }),
      makeStoreCredit({
        tenantId: new UniqueEntityID(tenantId),
        customerId: customerB,
        amount: 200,
      }),
    );

    const result = await sut.execute({
      tenantId,
      customerId: customerA.toString(),
    });

    expect(result.storeCredits).toHaveLength(2);
    expect(result.meta.total).toBe(2);
  });

  it('should return empty list when no credits exist', async () => {
    const result = await sut.execute({ tenantId });

    expect(result.storeCredits).toHaveLength(0);
    expect(result.meta.total).toBe(0);
    expect(result.meta.pages).toBe(0);
  });

  it('should use default pagination when not provided', async () => {
    storeCreditsRepository.items.push(
      makeStoreCredit({
        tenantId: new UniqueEntityID(tenantId),
      }),
    );

    const result = await sut.execute({ tenantId });

    expect(result.meta.page).toBe(1);
    expect(result.meta.limit).toBe(20);
  });

  it('should not list credits from another tenant', async () => {
    storeCreditsRepository.items.push(
      makeStoreCredit({
        tenantId: new UniqueEntityID('other-tenant'),
        amount: 100,
      }),
    );

    const result = await sut.execute({ tenantId });

    expect(result.storeCredits).toHaveLength(0);
  });
});
