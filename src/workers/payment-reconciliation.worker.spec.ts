import { beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Prisma + service mocks — must be registered BEFORE importing the worker
// ---------------------------------------------------------------------------

const mockFindManyTenants = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    tenant: {
      findMany: (...args: unknown[]) => mockFindManyTenants(...args),
    },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('@/lib/telemetry/payment-reconciliation-telemetry', () => ({
  recordPaymentReconciliation: vi.fn(),
}));

// Stub all repositories the worker composes with — the worker contracts
// with the service, not the repositories, so the repositories only need
// to be constructible.
vi.mock('@/repositories/sales/prisma/prisma-orders-repository', () => ({
  PrismaOrdersRepository: vi.fn().mockImplementation(() => ({})),
}));
vi.mock(
  '@/repositories/sales/prisma/prisma-payment-charges-repository',
  () => ({
    PrismaPaymentChargesRepository: vi.fn().mockImplementation(() => ({})),
  }),
);
vi.mock(
  '@/repositories/sales/prisma/prisma-payment-configs-repository',
  () => ({
    PrismaPaymentConfigsRepository: vi.fn().mockImplementation(() => ({})),
  }),
);
vi.mock(
  '@/repositories/sales/prisma/prisma-pos-transaction-payments-repository',
  () => ({
    PrismaPosTransactionPaymentsRepository: vi
      .fn()
      .mockImplementation(() => ({})),
  }),
);
vi.mock(
  '@/repositories/sales/prisma/prisma-pos-transactions-repository',
  () => ({
    PrismaPosTransactionsRepository: vi.fn().mockImplementation(() => ({})),
  }),
);
vi.mock('@/services/payment/payment-provider.factory', () => ({
  PaymentProviderFactory: vi.fn().mockImplementation(() => ({})),
}));

// ChargeReconciliationService is what the worker actually invokes per tenant.
// We expose a mutable fake so each test can control the per-tenant outcome.
const reconcileOverdueChargesSpy = vi.fn();

vi.mock('@/services/payment/charge-reconciliation.service', () => ({
  ChargeReconciliationService: vi.fn().mockImplementation(() => ({
    withTenant: () => ({
      reconcileOverdueCharges: reconcileOverdueChargesSpy,
    }),
  })),
}));

import { PaymentReconciliationWorker } from './payment-reconciliation.worker';

describe('PaymentReconciliationWorker (P3-23 smoke)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reconcileOverdueChargesSpy.mockReset();
  });

  it('returns early when no tenants require reconciliation', async () => {
    mockFindManyTenants.mockResolvedValue([]);

    const worker = new PaymentReconciliationWorker();
    await worker.execute();

    expect(reconcileOverdueChargesSpy).not.toHaveBeenCalled();
  });

  it('invokes the reconciliation service once per tenant returned by the query', async () => {
    mockFindManyTenants.mockResolvedValue([
      { id: 'tenant-a' },
      { id: 'tenant-b' },
    ]);

    reconcileOverdueChargesSpy.mockResolvedValue({
      processed: 5,
      confirmed: 3,
      failed: 1,
      expired: 1,
      notFound: 0,
      errors: [],
    });

    const worker = new PaymentReconciliationWorker();
    await worker.execute();

    expect(reconcileOverdueChargesSpy).toHaveBeenCalledTimes(2);
  });

  it('continues processing remaining tenants when one fails', async () => {
    mockFindManyTenants.mockResolvedValue([
      { id: 'tenant-boom' },
      { id: 'tenant-ok' },
    ]);

    reconcileOverdueChargesSpy
      .mockRejectedValueOnce(new Error('provider timeout'))
      .mockResolvedValueOnce({
        processed: 2,
        confirmed: 2,
        failed: 0,
        expired: 0,
        notFound: 0,
        errors: [],
      });

    const worker = new PaymentReconciliationWorker();
    await worker.execute();

    // Both tenants must be attempted — a failure on the first must not
    // short-circuit the loop.
    expect(reconcileOverdueChargesSpy).toHaveBeenCalledTimes(2);
  });

  it('only targets ACTIVE, non-soft-deleted tenants with overdue PENDING charges', async () => {
    mockFindManyTenants.mockResolvedValue([]);

    const worker = new PaymentReconciliationWorker();
    await worker.execute();

    expect(mockFindManyTenants).toHaveBeenCalledTimes(1);

    const [callArgs] = mockFindManyTenants.mock.calls[0] as [
      { where?: Record<string, unknown> },
    ];
    expect(callArgs.where).toMatchObject({
      status: 'ACTIVE',
      deletedAt: null,
    });
  });
});
