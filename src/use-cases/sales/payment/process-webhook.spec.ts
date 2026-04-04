import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PaymentCharge } from '@/entities/sales/payment-charge';
import { InMemoryPaymentChargesRepository } from '@/repositories/sales/in-memory/in-memory-payment-charges-repository';
import { InMemoryPaymentConfigsRepository } from '@/repositories/sales/in-memory/in-memory-payment-configs-repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProcessWebhookUseCase } from './process-webhook';

// Mock provider-registry to avoid real HTTP calls
vi.mock('@/services/payment/provider-registry', () => ({
  createPaymentProvider: vi.fn().mockReturnValue({
    name: 'infinitepay',
    handleWebhook: vi.fn().mockResolvedValue({
      chargeId: 'ext-charge-789',
      status: 'PAID',
      paidAmount: 5000,
      metadata: { event: 'PAYMENT_CONFIRMED' },
    }),
  }),
}));

let paymentChargesRepository: InMemoryPaymentChargesRepository;
let paymentConfigsRepository: InMemoryPaymentConfigsRepository;
let processWebhook: ProcessWebhookUseCase;

describe('ProcessWebhookUseCase', () => {
  beforeEach(() => {
    paymentChargesRepository = new InMemoryPaymentChargesRepository();
    paymentConfigsRepository = new InMemoryPaymentConfigsRepository();
    processWebhook = new ProcessWebhookUseCase(
      paymentChargesRepository,
      paymentConfigsRepository,
    );
  });

  it('should process a valid webhook and update charge status', async () => {
    const charge = PaymentCharge.create({
      tenantId: new UniqueEntityID('tenant-1'),
      orderId: new UniqueEntityID('order-1'),
      provider: 'infinitepay',
      providerChargeId: 'ext-charge-789',
      method: 'PIX',
      amount: 5000,
      status: 'PENDING',
    });

    paymentChargesRepository.items.push(charge);

    const result = await processWebhook.execute({
      providerName: 'infinitepay',
      payload: { status: 'paid', invoice_slug: 'ext-charge-789' },
      headers: {},
    });

    expect(result.processed).toBe(true);
    expect(result.newStatus).toBe('PAID');

    const updatedCharge = paymentChargesRepository.items[0];
    expect(updatedCharge.status).toBe('PAID');
  });

  it('should be idempotent — second webhook for same charge is no-op', async () => {
    const charge = PaymentCharge.create({
      tenantId: new UniqueEntityID('tenant-1'),
      orderId: new UniqueEntityID('order-1'),
      provider: 'infinitepay',
      providerChargeId: 'ext-charge-789',
      method: 'PIX',
      amount: 5000,
      status: 'PAID', // Already paid
    });

    paymentChargesRepository.items.push(charge);

    const result = await processWebhook.execute({
      providerName: 'infinitepay',
      payload: { status: 'paid', invoice_slug: 'ext-charge-789' },
      headers: {},
    });

    // Processed = true because it found the charge and returned ok
    expect(result.processed).toBe(true);
    // Status didn't change because updateStatusIdempotent returned 0
    expect(result.newStatus).toBe('PAID');
  });

  it('should return not processed for unknown provider', async () => {
    const result = await processWebhook.execute({
      providerName: 'unknown-gateway',
      payload: {},
      headers: {},
    });

    expect(result.processed).toBe(false);
  });

  it('should return not processed when charge not found', async () => {
    // The mock will return chargeId 'ext-charge-789', but no charge exists
    const result = await processWebhook.execute({
      providerName: 'infinitepay',
      payload: { status: 'paid' },
      headers: {},
    });

    expect(result.processed).toBe(false);
  });
});
