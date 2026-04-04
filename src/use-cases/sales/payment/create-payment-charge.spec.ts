import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { InMemoryPaymentChargesRepository } from '@/repositories/sales/in-memory/in-memory-payment-charges-repository';
import { InMemoryPaymentConfigsRepository } from '@/repositories/sales/in-memory/in-memory-payment-configs-repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreatePaymentChargeUseCase } from './create-payment-charge';

// Mock PaymentProviderFactory to avoid FieldCipherService dependency
vi.mock('@/services/payment/payment-provider.factory', () => ({
  PaymentProviderFactory: vi.fn().mockImplementation(() => ({
    resolve: vi.fn().mockReturnValue({
      name: 'manual',
      supportedMethods: [
        'PIX',
        'CREDIT_CARD',
        'DEBIT_CARD',
        'BOLETO',
        'PAYMENT_LINK',
        'CASH',
      ],
      createCharge: vi.fn().mockResolvedValue({
        chargeId: 'charge-uuid-123',
        status: 'PAID',
        rawResponse: { manual: true },
      }),
    }),
  })),
}));

let paymentConfigsRepository: InMemoryPaymentConfigsRepository;
let paymentChargesRepository: InMemoryPaymentChargesRepository;
let createPaymentCharge: CreatePaymentChargeUseCase;

describe('CreatePaymentChargeUseCase', () => {
  beforeEach(() => {
    paymentConfigsRepository = new InMemoryPaymentConfigsRepository();
    paymentChargesRepository = new InMemoryPaymentChargesRepository();
    createPaymentCharge = new CreatePaymentChargeUseCase(
      paymentConfigsRepository,
      paymentChargesRepository,
    );
  });

  it('should create a payment charge via manual provider', async () => {
    const result = await createPaymentCharge.execute({
      tenantId: 'tenant-1',
      orderId: 'order-1',
      orderNumber: 'ORD-001',
      method: 'CASH',
      amount: 5000,
    });

    expect(result.paymentCharge).toBeDefined();
    expect(result.paymentCharge.provider).toBe('manual');
    expect(result.paymentCharge.status).toBe('PAID');
    expect(result.paymentCharge.amount).toBe(5000);
    expect(paymentChargesRepository.items).toHaveLength(1);
  });

  it('should create a PIX charge', async () => {
    const result = await createPaymentCharge.execute({
      tenantId: 'tenant-1',
      orderId: 'order-2',
      orderNumber: 'ORD-002',
      method: 'PIX',
      amount: 10000,
      customerName: 'John Doe',
      customerDocument: '12345678901',
    });

    expect(result.paymentCharge).toBeDefined();
    expect(result.paymentCharge.method).toBe('PIX');
  });

  it('should reject zero amount', async () => {
    await expect(() =>
      createPaymentCharge.execute({
        tenantId: 'tenant-1',
        orderId: 'order-1',
        orderNumber: 'ORD-001',
        method: 'CASH',
        amount: 0,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should reject negative amount', async () => {
    await expect(() =>
      createPaymentCharge.execute({
        tenantId: 'tenant-1',
        orderId: 'order-1',
        orderNumber: 'ORD-001',
        method: 'CASH',
        amount: -100,
      }),
    ).rejects.toThrow(BadRequestError);
  });
});
