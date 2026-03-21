import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryCustomersRepository } from '@/repositories/sales/in-memory/in-memory-customers-repository';
import { InMemoryStoreCreditsRepository } from '@/repositories/sales/in-memory/in-memory-store-credits-repository';
import { makeCustomer } from '@/utils/tests/factories/sales/make-customer';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateManualCreditUseCase } from './create-manual-credit';

let storeCreditsRepository: InMemoryStoreCreditsRepository;
let customersRepository: InMemoryCustomersRepository;
let sut: CreateManualCreditUseCase;

const tenantId = 'tenant-1';

describe('Create Manual Credit', () => {
  beforeEach(() => {
    storeCreditsRepository = new InMemoryStoreCreditsRepository();
    customersRepository = new InMemoryCustomersRepository();
    sut = new CreateManualCreditUseCase(
      storeCreditsRepository,
      customersRepository,
    );
  });

  it('should create a manual store credit', async () => {
    const customer = makeCustomer({ tenantId: new UniqueEntityID(tenantId) });
    customersRepository.items.push(customer);

    const result = await sut.execute({
      tenantId,
      customerId: customer.id.toString(),
      amount: 200,
    });

    expect(result.storeCredit.amount).toBe(200);
    expect(result.storeCredit.balance).toBe(200);
    expect(result.storeCredit.source).toBe('MANUAL');
    expect(result.storeCredit.isActive).toBe(true);
    expect(storeCreditsRepository.items).toHaveLength(1);
  });

  it('should not create credit for non-existing customer', async () => {
    await expect(
      sut.execute({
        tenantId,
        customerId: 'non-existing',
        amount: 100,
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
