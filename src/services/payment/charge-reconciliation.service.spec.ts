import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PaymentCharge } from '@/entities/sales/payment-charge';
import { InMemoryOrdersRepository } from '@/repositories/sales/in-memory/in-memory-orders-repository';
import { InMemoryPaymentChargesRepository } from '@/repositories/sales/in-memory/in-memory-payment-charges-repository';
import { InMemoryPaymentConfigsRepository } from '@/repositories/sales/in-memory/in-memory-payment-configs-repository';
import { makeOrder } from '@/utils/tests/factories/sales/make-order';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChargeReconciliationService } from './charge-reconciliation.service';

const publishMock = vi.fn();

vi.mock('@/lib/events/typed-event-bus', () => ({
  getTypedEventBus: () => ({
    publish: publishMock,
  }),
}));

interface ProviderStatus {
  status: 'PENDING' | 'PAID' | 'EXPIRED' | 'FAILED' | 'REFUNDED';
  paidAmount?: number;
  paidAt?: Date;
}

class FakePaymentProviderFactory {
  constructor(
    private statusByChargeId: Record<string, ProviderStatus>,
    private throwByChargeId: Record<string, Error> = {},
  ) {}

  resolveByName() {
    return {
      checkStatus: async (chargeId: string) => {
        if (this.throwByChargeId[chargeId]) {
          throw this.throwByChargeId[chargeId];
        }

        return this.statusByChargeId[chargeId] ?? { status: 'PENDING' };
      },
    };
  }
}

const tenantId = 'tenant-1';

function makeOverdueCharge(params: {
  orderId: string;
  providerChargeId: string;
  amount: number;
}): PaymentCharge {
  const now = Date.now();

  return PaymentCharge.create({
    tenantId: new UniqueEntityID(tenantId),
    orderId: new UniqueEntityID(params.orderId),
    provider: 'infinitepay',
    providerChargeId: params.providerChargeId,
    method: 'PIX',
    amount: params.amount,
    status: 'PENDING',
    createdAt: new Date(now - 25 * 60 * 60 * 1000),
    updatedAt: new Date(now - 25 * 60 * 60 * 1000),
  });
}

describe('ChargeReconciliationService', () => {
  let paymentChargesRepository: InMemoryPaymentChargesRepository;
  let paymentConfigsRepository: InMemoryPaymentConfigsRepository;
  let ordersRepository: InMemoryOrdersRepository;

  beforeEach(() => {
    paymentChargesRepository = new InMemoryPaymentChargesRepository();
    paymentConfigsRepository = new InMemoryPaymentConfigsRepository();
    ordersRepository = new InMemoryOrdersRepository();
    publishMock.mockReset();
  });

  it('should reconcile overdue charges and update statuses', async () => {
    const orderPaid = makeOrder({
      tenantId: new UniqueEntityID(tenantId),
      status: 'PENDING',
      grandTotal: 120,
      subtotal: 120,
      paidAmount: 0,
      remainingAmount: 120,
    });
    const orderFailed = makeOrder({
      tenantId: new UniqueEntityID(tenantId),
      status: 'PENDING',
      grandTotal: 50,
      subtotal: 50,
      paidAmount: 0,
      remainingAmount: 50,
    });
    const orderExpired = makeOrder({
      tenantId: new UniqueEntityID(tenantId),
      status: 'PENDING',
      grandTotal: 30,
      subtotal: 30,
      paidAmount: 0,
      remainingAmount: 30,
    });

    await ordersRepository.create(orderPaid);
    await ordersRepository.create(orderFailed);
    await ordersRepository.create(orderExpired);

    const paidCharge = makeOverdueCharge({
      orderId: orderPaid.id.toString(),
      providerChargeId: 'charge-paid',
      amount: 120,
    });
    const failedCharge = makeOverdueCharge({
      orderId: orderFailed.id.toString(),
      providerChargeId: 'charge-failed',
      amount: 50,
    });
    const expiredCharge = makeOverdueCharge({
      orderId: orderExpired.id.toString(),
      providerChargeId: 'charge-expired',
      amount: 30,
    });

    paymentChargesRepository.items.push(
      paidCharge,
      failedCharge,
      expiredCharge,
    );

    const paymentProviderFactory = new FakePaymentProviderFactory({
      'charge-paid': {
        status: 'PAID',
        paidAmount: 120,
        paidAt: new Date(),
      },
      'charge-failed': { status: 'FAILED' },
      'charge-expired': { status: 'EXPIRED' },
    });

    const service = new ChargeReconciliationService(
      paymentChargesRepository,
      paymentConfigsRepository,
      paymentProviderFactory as never,
      ordersRepository,
    ).withTenant(tenantId);

    const result = await service.reconcileOverdueCharges();

    expect(result.processed).toBe(3);
    expect(result.confirmed).toBe(1);
    expect(result.failed).toBe(1);
    expect(result.expired).toBe(1);
    expect(result.errors).toHaveLength(0);

    expect(paidCharge.status).toBe('PAID');
    expect(failedCharge.status).toBe('FAILED');
    expect(expiredCharge.status).toBe('EXPIRED');
  });

  it('should confirm order when all charges are paid', async () => {
    const order = makeOrder({
      tenantId: new UniqueEntityID(tenantId),
      status: 'PENDING',
      grandTotal: 100,
      subtotal: 100,
      paidAmount: 0,
      remainingAmount: 100,
    });

    await ordersRepository.create(order);

    const paidCharge = makeOverdueCharge({
      orderId: order.id.toString(),
      providerChargeId: 'charge-to-confirm',
      amount: 100,
    });

    paymentChargesRepository.items.push(paidCharge);

    const paymentProviderFactory = new FakePaymentProviderFactory({
      'charge-to-confirm': {
        status: 'PAID',
        paidAmount: 100,
        paidAt: new Date(),
      },
    });

    const service = new ChargeReconciliationService(
      paymentChargesRepository,
      paymentConfigsRepository,
      paymentProviderFactory as never,
      ordersRepository,
    ).withTenant(tenantId);

    await service.reconcileOverdueCharges();

    const updatedOrder = await ordersRepository.findById(order.id, tenantId);

    expect(updatedOrder).not.toBeNull();
    expect(updatedOrder?.status).toBe('CONFIRMED');
    expect(updatedOrder?.paidAmount).toBe(100);
    expect(publishMock).toHaveBeenCalled();
  });

  it('should continue processing when provider check fails', async () => {
    const order1 = makeOrder({
      tenantId: new UniqueEntityID(tenantId),
      status: 'PENDING',
      grandTotal: 40,
      subtotal: 40,
    });
    const order2 = makeOrder({
      tenantId: new UniqueEntityID(tenantId),
      status: 'PENDING',
      grandTotal: 60,
      subtotal: 60,
    });

    await ordersRepository.create(order1);
    await ordersRepository.create(order2);

    const failingCharge = makeOverdueCharge({
      orderId: order1.id.toString(),
      providerChargeId: 'charge-error',
      amount: 40,
    });
    const paidCharge = makeOverdueCharge({
      orderId: order2.id.toString(),
      providerChargeId: 'charge-ok',
      amount: 60,
    });

    paymentChargesRepository.items.push(failingCharge, paidCharge);

    const paymentProviderFactory = new FakePaymentProviderFactory(
      {
        'charge-ok': {
          status: 'PAID',
          paidAmount: 60,
          paidAt: new Date(),
        },
      },
      {
        'charge-error': new Error('Provider unavailable'),
      },
    );

    const service = new ChargeReconciliationService(
      paymentChargesRepository,
      paymentConfigsRepository,
      paymentProviderFactory as never,
      ordersRepository,
    ).withTenant(tenantId);

    const result = await service.reconcileOverdueCharges();

    expect(result.processed).toBe(2);
    expect(result.confirmed).toBe(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].chargeId).toBe(failingCharge.id.toString());
    expect(paidCharge.status).toBe('PAID');
  });
});
