import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { InMemoryTransactionManager } from '@/lib/in-memory-transaction-manager';
import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import { InMemoryFinanceEntryPaymentsRepository } from '@/repositories/finance/in-memory/in-memory-finance-entry-payments-repository';
import { InMemoryPaymentOrdersRepository } from '@/repositories/finance/in-memory/in-memory-payment-orders-repository';
import type {
  BankingProvider,
  PaymentReceipt,
} from '@/services/banking/banking-provider.interface';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApprovePaymentOrderUseCase } from './approve-payment-order';

vi.mock('@/workers/queues/audit.queue', () => ({
  queueAuditLog: vi.fn().mockResolvedValue(undefined),
}));

function makeMockProvider(
  overrides?: Partial<BankingProvider>,
): BankingProvider {
  const receipt: PaymentReceipt = {
    externalId: 'ext-123',
    method: 'PIX',
    amount: 1000,
    status: 'COMPLETED',
    executedAt: new Date().toISOString(),
    receiptData: { confirmationCode: 'ABC123' },
  };

  return {
    providerName: 'MOCK',
    capabilities: ['PIX', 'PAYMENT', 'TED'],
    authenticate: vi.fn().mockResolvedValue(undefined),
    healthCheck: vi.fn(),
    getAccounts: vi.fn().mockResolvedValue([]),
    getBalance: vi.fn().mockResolvedValue({
      available: 0,
      current: 0,
      currency: 'BRL',
      updatedAt: '',
    }),
    getTransactions: vi.fn().mockResolvedValue([]),
    createBoleto: vi.fn().mockResolvedValue({}),
    cancelBoleto: vi.fn().mockResolvedValue(undefined),
    getBoleto: vi.fn().mockResolvedValue({}),
    createPixCharge: vi.fn().mockResolvedValue({}),
    executePixPayment: vi.fn().mockResolvedValue(receipt),
    getPixCharge: vi.fn().mockResolvedValue({}),
    executePayment: vi.fn().mockResolvedValue(receipt),
    getPaymentStatus: vi.fn().mockResolvedValue({}),
    registerWebhook: vi.fn().mockResolvedValue(undefined),
    handleWebhookPayload: vi.fn().mockResolvedValue({}),
    ...overrides,
  };
}

let paymentOrdersRepository: InMemoryPaymentOrdersRepository;
let entriesRepository: InMemoryFinanceEntriesRepository;
let paymentsRepository: InMemoryFinanceEntryPaymentsRepository;
let transactionManager: InMemoryTransactionManager;
let mockProvider: BankingProvider;
let sut: ApprovePaymentOrderUseCase;

describe('ApprovePaymentOrderUseCase — concurrency', () => {
  beforeEach(() => {
    paymentOrdersRepository = new InMemoryPaymentOrdersRepository();
    entriesRepository = new InMemoryFinanceEntriesRepository();
    paymentsRepository = new InMemoryFinanceEntryPaymentsRepository();
    transactionManager = new InMemoryTransactionManager();
    mockProvider = makeMockProvider();
    sut = new ApprovePaymentOrderUseCase(
      paymentOrdersRepository,
      entriesRepository,
      async () => mockProvider,
      undefined,
      transactionManager,
      paymentsRepository,
    );
  });

  it('should reject the second of two concurrent approvals for the same order', async () => {
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAY-001',
      description: 'Supplier payment',
      categoryId: 'category-1',
      expectedAmount: 1000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
    });

    const order = await paymentOrdersRepository.create({
      tenantId: 'tenant-1',
      entryId: entry.id.toString(),
      bankAccountId: 'bank-account-1',
      method: 'PIX',
      amount: 1000,
      recipientData: { pixKey: 'recipient@email.com' },
      requestedById: 'user-requester',
    });

    const results = await Promise.allSettled([
      sut.execute({
        orderId: order.id,
        tenantId: 'tenant-1',
        approvedById: 'approver-a',
      }),
      sut.execute({
        orderId: order.id,
        tenantId: 'tenant-1',
        approvedById: 'approver-b',
      }),
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(
      BadRequestError,
    );

    // Bank provider must have been invoked exactly once.
    expect(mockProvider.executePixPayment).toHaveBeenCalledTimes(1);
  });

  it('should set entry actualAmount to sum(payments) + order.amount, not just order.amount', async () => {
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAY-002',
      description: 'Partial then final',
      categoryId: 'category-1',
      expectedAmount: 1000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
    });

    // An earlier partial payment already recorded on the entry.
    await paymentsRepository.create({
      entryId: entry.id.toString(),
      amount: 400,
      paidAt: new Date('2026-01-10'),
      method: 'PIX',
    });

    const order = await paymentOrdersRepository.create({
      tenantId: 'tenant-1',
      entryId: entry.id.toString(),
      bankAccountId: 'bank-account-1',
      method: 'PIX',
      amount: 600,
      recipientData: { pixKey: 'vendor@x.com' },
      requestedById: 'user-requester',
    });

    const result = await sut.execute({
      orderId: order.id,
      tenantId: 'tenant-1',
      approvedById: 'approver',
    });

    expect(result.order.status).toBe('COMPLETED');

    const updatedEntry = await entriesRepository.findById(entry.id, 'tenant-1');
    // Sum of existing payment (400) + order (600) = 1000 → fully paid.
    expect(updatedEntry?.actualAmount).toBe(1000);
    expect(updatedEntry?.status).toBe('PAID');
  });

  it('should mark entry as PARTIALLY_PAID when sum is below totalDue', async () => {
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAY-003',
      description: 'Partial only',
      categoryId: 'category-1',
      expectedAmount: 1000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
    });

    const order = await paymentOrdersRepository.create({
      tenantId: 'tenant-1',
      entryId: entry.id.toString(),
      bankAccountId: 'bank-account-1',
      method: 'PIX',
      amount: 300,
      recipientData: { pixKey: 'vendor@x.com' },
      requestedById: 'user-requester',
    });

    const result = await sut.execute({
      orderId: order.id,
      tenantId: 'tenant-1',
      approvedById: 'approver',
    });

    expect(result.order.status).toBe('COMPLETED');

    const updatedEntry = await entriesRepository.findById(entry.id, 'tenant-1');
    expect(updatedEntry?.actualAmount).toBe(300);
    expect(updatedEntry?.status).toBe('PARTIALLY_PAID');
  });

  it('should keep the order in FAILED state and not update entry if banking call throws', async () => {
    const failingProvider = makeMockProvider({
      executePixPayment: vi.fn().mockRejectedValue(new Error('Bank timeout')),
    });
    sut = new ApprovePaymentOrderUseCase(
      paymentOrdersRepository,
      entriesRepository,
      async () => failingProvider,
      undefined,
      transactionManager,
      paymentsRepository,
    );

    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAY-004',
      description: 'Will fail',
      categoryId: 'category-1',
      expectedAmount: 500,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
    });

    const order = await paymentOrdersRepository.create({
      tenantId: 'tenant-1',
      entryId: entry.id.toString(),
      bankAccountId: 'bank-account-1',
      method: 'PIX',
      amount: 500,
      recipientData: { pixKey: 'vendor@x.com' },
      requestedById: 'user-requester',
    });

    const result = await sut.execute({
      orderId: order.id,
      tenantId: 'tenant-1',
      approvedById: 'approver',
    });

    expect(result.order.status).toBe('FAILED');
    expect(result.order.errorMessage).toBe('Bank timeout');

    const updatedEntry = await entriesRepository.findById(entry.id, 'tenant-1');
    expect(updatedEntry?.status).toBe('PENDING');
    expect(updatedEntry?.actualAmount ?? 0).toBe(0);
  });
});
