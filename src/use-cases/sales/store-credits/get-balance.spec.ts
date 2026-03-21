import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryStoreCreditsRepository } from '@/repositories/sales/in-memory/in-memory-store-credits-repository';
import { makeStoreCredit } from '@/utils/tests/factories/sales/make-store-credit';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetBalanceUseCase } from './get-balance';

let storeCreditsRepository: InMemoryStoreCreditsRepository;
let sut: GetBalanceUseCase;

const tenantId = 'tenant-1';
const customerId = new UniqueEntityID();

describe('Get Balance', () => {
  beforeEach(() => {
    storeCreditsRepository = new InMemoryStoreCreditsRepository();
    sut = new GetBalanceUseCase(storeCreditsRepository);
  });

  it('should get total balance for a customer', async () => {
    storeCreditsRepository.items.push(
      makeStoreCredit({
        tenantId: new UniqueEntityID(tenantId),
        customerId,
        amount: 100,
      }),
      makeStoreCredit({
        tenantId: new UniqueEntityID(tenantId),
        customerId,
        amount: 50,
      }),
    );

    const result = await sut.execute({
      customerId: customerId.toString(),
      tenantId,
    });

    expect(result.balance).toBe(150);
  });

  it('should return zero for customer with no credits', async () => {
    const result = await sut.execute({
      customerId: 'no-credits-customer',
      tenantId,
    });

    expect(result.balance).toBe(0);
  });

  it('should not include inactive credits', async () => {
    storeCreditsRepository.items.push(
      makeStoreCredit({
        tenantId: new UniqueEntityID(tenantId),
        customerId,
        amount: 100,
        isActive: false,
      }),
      makeStoreCredit({
        tenantId: new UniqueEntityID(tenantId),
        customerId,
        amount: 50,
      }),
    );

    const result = await sut.execute({
      customerId: customerId.toString(),
      tenantId,
    });

    expect(result.balance).toBe(50);
  });
});
