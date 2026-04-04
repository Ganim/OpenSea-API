import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PaymentCharge } from '@/entities/sales/payment-charge';
import { InMemoryPaymentChargesRepository } from '@/repositories/sales/in-memory/in-memory-payment-charges-repository';
import { InMemoryPaymentConfigsRepository } from '@/repositories/sales/in-memory/in-memory-payment-configs-repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CheckChargeStatusUseCase } from './check-charge-status';

// Mock PaymentProviderFactory
vi.mock('@/services/payment/payment-provider.factory', () => ({
  PaymentProviderFactory: vi.fn().mockImplementation(() => ({
    resolve: vi.fn().mockReturnValue({
      name: 'infinitepay',
      checkStatus: vi.fn().mockResolvedValue({
        status: 'PAID',
        paidAt: new Date(),
        paidAmount: 5000,
      }),
    }),
  })),
}));

let paymentChargesRepository: InMemoryPaymentChargesRepository;
let paymentConfigsRepository: InMemoryPaymentConfigsRepository;
let checkChargeStatus: CheckChargeStatusUseCase;

describe('CheckChargeStatusUseCase', () => {
  beforeEach(() => {
    paymentChargesRepository = new InMemoryPaymentChargesRepository();
    paymentConfigsRepository = new InMemoryPaymentConfigsRepository();
    checkChargeStatus = new CheckChargeStatusUseCase(
      paymentChargesRepository,
      paymentConfigsRepository,
    );
  });

  it('should throw when charge is not found', async () => {
    await expect(() =>
      checkChargeStatus.execute({
        tenantId: 'tenant-1',
        chargeId: 'nonexistent',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should return unchanged for already-paid charge', async () => {
    const charge = PaymentCharge.create({
      tenantId: new UniqueEntityID('tenant-1'),
      orderId: new UniqueEntityID('order-1'),
      provider: 'infinitepay',
      providerChargeId: 'ext-123',
      method: 'PIX',
      amount: 5000,
      status: 'PAID',
    });

    paymentChargesRepository.items.push(charge);

    const result = await checkChargeStatus.execute({
      tenantId: 'tenant-1',
      chargeId: charge.id.toString(),
    });

    expect(result.changed).toBe(false);
    expect(result.paymentCharge.status).toBe('PAID');
  });

  it('should return unchanged for manual provider charges', async () => {
    const charge = PaymentCharge.create({
      tenantId: new UniqueEntityID('tenant-1'),
      orderId: new UniqueEntityID('order-1'),
      provider: 'manual',
      method: 'CASH',
      amount: 5000,
      status: 'PENDING',
    });

    paymentChargesRepository.items.push(charge);

    const result = await checkChargeStatus.execute({
      tenantId: 'tenant-1',
      chargeId: charge.id.toString(),
    });

    expect(result.changed).toBe(false);
  });

  it('should detect status change from provider', async () => {
    const charge = PaymentCharge.create({
      tenantId: new UniqueEntityID('tenant-1'),
      orderId: new UniqueEntityID('order-1'),
      provider: 'infinitepay',
      providerChargeId: 'ext-456',
      method: 'PIX',
      amount: 5000,
      status: 'PENDING',
    });

    paymentChargesRepository.items.push(charge);

    const result = await checkChargeStatus.execute({
      tenantId: 'tenant-1',
      chargeId: charge.id.toString(),
    });

    expect(result.changed).toBe(true);
    expect(result.paymentCharge.status).toBe('PAID');
  });
});
