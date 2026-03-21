import { InMemoryPaymentConditionsRepository } from '@/repositories/sales/in-memory/in-memory-payment-conditions-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreatePaymentConditionUseCase } from './create-payment-condition';

let paymentConditionsRepository: InMemoryPaymentConditionsRepository;
let sut: CreatePaymentConditionUseCase;

describe('Create Payment Condition', () => {
  beforeEach(() => {
    paymentConditionsRepository = new InMemoryPaymentConditionsRepository();
    sut = new CreatePaymentConditionUseCase(paymentConditionsRepository);
  });

  it('should create a cash payment condition', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      name: 'A Vista',
      type: 'CASH',
      discountCash: 5,
    });

    expect(result.paymentCondition.name).toBe('A Vista');
    expect(result.paymentCondition.type).toBe('CASH');
    expect(result.paymentCondition.discountCash).toBe(5);
    expect(result.paymentCondition.installments).toBe(1);
    expect(paymentConditionsRepository.items).toHaveLength(1);
  });

  it('should create an installment payment condition', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      name: '30/60/90',
      type: 'INSTALLMENT',
      installments: 3,
      firstDueDays: 30,
      intervalDays: 30,
    });

    expect(result.paymentCondition.name).toBe('30/60/90');
    expect(result.paymentCondition.type).toBe('INSTALLMENT');
    expect(result.paymentCondition.installments).toBe(3);
    expect(result.paymentCondition.firstDueDays).toBe(30);
    expect(result.paymentCondition.intervalDays).toBe(30);
  });

  it('should create a payment condition with down payment', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      name: 'Entrada + 3x',
      type: 'INSTALLMENT',
      installments: 3,
      downPaymentPercent: 30,
      firstDueDays: 30,
      intervalDays: 30,
    });

    expect(result.paymentCondition.downPaymentPercent).toBe(30);
  });
});
