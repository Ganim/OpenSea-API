import { InMemoryPaymentConditionsRepository } from '@/repositories/sales/in-memory/in-memory-payment-conditions-repository';
import { PaymentCondition } from '@/entities/sales/payment-condition';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListPaymentConditionsUseCase } from './list-payment-conditions';

let paymentConditionsRepository: InMemoryPaymentConditionsRepository;
let sut: ListPaymentConditionsUseCase;

describe('ListPaymentConditionsUseCase', () => {
  beforeEach(() => {
    paymentConditionsRepository = new InMemoryPaymentConditionsRepository();
    sut = new ListPaymentConditionsUseCase(paymentConditionsRepository);
  });

  it('should list payment conditions with pagination', async () => {
    for (let i = 0; i < 5; i++) {
      const condition = PaymentCondition.create({
        tenantId: new UniqueEntityID('tenant-1'),
        name: `Condition ${i}`,
        type: 'CASH',
      });
      await paymentConditionsRepository.create(condition);
    }

    const result = await sut.execute({
      tenantId: 'tenant-1',
      page: 1,
      limit: 3,
    });

    expect(result.paymentConditions).toHaveLength(3);
    expect(result.total).toBe(5);
    expect(result.totalPages).toBe(2);
  });

  it('should return empty list when no conditions exist', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      page: 1,
      limit: 20,
    });

    expect(result.paymentConditions).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it('should filter by type', async () => {
    const cashCondition = PaymentCondition.create({
      tenantId: new UniqueEntityID('tenant-1'),
      name: 'Cash',
      type: 'CASH',
    });
    const installmentCondition = PaymentCondition.create({
      tenantId: new UniqueEntityID('tenant-1'),
      name: 'Installment',
      type: 'INSTALLMENT',
    });
    await paymentConditionsRepository.create(cashCondition);
    await paymentConditionsRepository.create(installmentCondition);

    const result = await sut.execute({
      tenantId: 'tenant-1',
      page: 1,
      limit: 20,
      type: 'CASH',
    });

    expect(result.paymentConditions).toHaveLength(1);
    expect(result.paymentConditions[0].type).toBe('CASH');
  });

  it('should filter by isActive', async () => {
    const active = PaymentCondition.create({
      tenantId: new UniqueEntityID('tenant-1'),
      name: 'Active',
      type: 'CASH',
      isActive: true,
    });
    const inactive = PaymentCondition.create({
      tenantId: new UniqueEntityID('tenant-1'),
      name: 'Inactive',
      type: 'CASH',
      isActive: false,
    });
    await paymentConditionsRepository.create(active);
    await paymentConditionsRepository.create(inactive);

    const result = await sut.execute({
      tenantId: 'tenant-1',
      page: 1,
      limit: 20,
      isActive: true,
    });

    expect(result.paymentConditions).toHaveLength(1);
    expect(result.paymentConditions[0].name).toBe('Active');
  });
});
