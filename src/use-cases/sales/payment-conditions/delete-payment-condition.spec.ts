import { InMemoryPaymentConditionsRepository } from '@/repositories/sales/in-memory/in-memory-payment-conditions-repository';
import { PaymentCondition } from '@/entities/sales/payment-condition';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeletePaymentConditionUseCase } from './delete-payment-condition';

let paymentConditionsRepository: InMemoryPaymentConditionsRepository;
let sut: DeletePaymentConditionUseCase;

describe('DeletePaymentConditionUseCase', () => {
  beforeEach(() => {
    paymentConditionsRepository = new InMemoryPaymentConditionsRepository();
    sut = new DeletePaymentConditionUseCase(paymentConditionsRepository);
  });

  it('should delete an existing payment condition', async () => {
    const condition = PaymentCondition.create({
      tenantId: new UniqueEntityID('tenant-1'),
      name: 'Cash Payment',
      type: 'CASH',
    });
    await paymentConditionsRepository.create(condition);

    await sut.execute({
      id: condition.id.toString(),
      tenantId: 'tenant-1',
    });

    expect(condition.isDeleted).toBe(true);
  });

  it('should throw if payment condition is not found', async () => {
    await expect(
      sut.execute({
        id: 'non-existent',
        tenantId: 'tenant-1',
      }),
    ).rejects.toThrow('Payment condition not found.');
  });

  it('should throw if condition belongs to another tenant', async () => {
    const condition = PaymentCondition.create({
      tenantId: new UniqueEntityID('tenant-1'),
      name: 'Cash Payment',
      type: 'CASH',
    });
    await paymentConditionsRepository.create(condition);

    await expect(
      sut.execute({
        id: condition.id.toString(),
        tenantId: 'tenant-2',
      }),
    ).rejects.toThrow('Payment condition not found.');
  });
});
