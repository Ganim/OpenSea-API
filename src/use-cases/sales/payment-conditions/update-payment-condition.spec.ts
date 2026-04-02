import { InMemoryPaymentConditionsRepository } from '@/repositories/sales/in-memory/in-memory-payment-conditions-repository';
import { PaymentCondition } from '@/entities/sales/payment-condition';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdatePaymentConditionUseCase } from './update-payment-condition';

let paymentConditionsRepository: InMemoryPaymentConditionsRepository;
let sut: UpdatePaymentConditionUseCase;

describe('UpdatePaymentConditionUseCase', () => {
  beforeEach(() => {
    paymentConditionsRepository = new InMemoryPaymentConditionsRepository();
    sut = new UpdatePaymentConditionUseCase(paymentConditionsRepository);
  });

  it('should update payment condition fields', async () => {
    const condition = PaymentCondition.create({
      tenantId: new UniqueEntityID('tenant-1'),
      name: 'Old Name',
      type: 'CASH',
    });
    await paymentConditionsRepository.create(condition);

    const result = await sut.execute({
      id: condition.id.toString(),
      tenantId: 'tenant-1',
      name: 'Updated Name',
      installments: 3,
      isActive: false,
    });

    expect(result.paymentCondition.name).toBe('Updated Name');
    expect(result.paymentCondition.installments).toBe(3);
    expect(result.paymentCondition.isActive).toBe(false);
  });

  it('should throw if condition is not found', async () => {
    await expect(
      sut.execute({
        id: 'non-existent',
        tenantId: 'tenant-1',
        name: 'Test',
      }),
    ).rejects.toThrow('Payment condition not found.');
  });

  it('should only update provided fields', async () => {
    const condition = PaymentCondition.create({
      tenantId: new UniqueEntityID('tenant-1'),
      name: 'Original',
      description: 'Original description',
      type: 'CASH',
    });
    await paymentConditionsRepository.create(condition);

    const result = await sut.execute({
      id: condition.id.toString(),
      tenantId: 'tenant-1',
      name: 'Updated',
    });

    expect(result.paymentCondition.name).toBe('Updated');
    expect(result.paymentCondition.description).toBe('Original description');
  });

  it('should update isDefault flag', async () => {
    const condition = PaymentCondition.create({
      tenantId: new UniqueEntityID('tenant-1'),
      name: 'Cash',
      type: 'CASH',
      isDefault: false,
    });
    await paymentConditionsRepository.create(condition);

    const result = await sut.execute({
      id: condition.id.toString(),
      tenantId: 'tenant-1',
      isDefault: true,
    });

    expect(result.paymentCondition.isDefault).toBe(true);
  });
});
