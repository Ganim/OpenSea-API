import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import { InMemoryPaymentOrdersRepository } from '@/repositories/finance/in-memory/in-memory-payment-orders-repository';
import type {
  BankingProvider,
  PaymentReceipt,
} from '@/services/banking/banking-provider.interface';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApprovePaymentOrderUseCase } from './approve-payment-order';

// Mock audit queue to avoid Redis connection in tests
vi.mock('@/workers/queues/audit.queue', () => ({
  queueAuditLog: vi.fn().mockResolvedValue(undefined),
}));

function createMockBankingProvider(
  overrides?: Partial<BankingProvider>,
): BankingProvider {
  const defaultReceipt: PaymentReceipt = {
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
    getAccounts: vi.fn().mockResolvedValue([]),
    getBalance: vi
      .fn()
      .mockResolvedValue({
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
    executePixPayment: vi.fn().mockResolvedValue(defaultReceipt),
    getPixCharge: vi.fn().mockResolvedValue({}),
    executePayment: vi.fn().mockResolvedValue(defaultReceipt),
    getPaymentStatus: vi.fn().mockResolvedValue({}),
    registerWebhook: vi.fn().mockResolvedValue(undefined),
    handleWebhookPayload: vi.fn().mockResolvedValue({}),
    ...overrides,
  };
}

let paymentOrdersRepository: InMemoryPaymentOrdersRepository;
let entriesRepository: InMemoryFinanceEntriesRepository;
let mockProvider: BankingProvider;
let sut: ApprovePaymentOrderUseCase;

describe('ApprovePaymentOrderUseCase', () => {
  beforeEach(() => {
    paymentOrdersRepository = new InMemoryPaymentOrdersRepository();
    entriesRepository = new InMemoryFinanceEntriesRepository();
    mockProvider = createMockBankingProvider();
    sut = new ApprovePaymentOrderUseCase(
      paymentOrdersRepository,
      entriesRepository,
      async () => mockProvider,
    );
  });

  it('should approve and execute payment successfully', async () => {
    // Create a finance entry
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAY-001',
      description: 'Supplier payment',
      categoryId: 'category-1',
      expectedAmount: 1000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
      status: 'PENDING',
    });

    // Create a payment order
    const order = await paymentOrdersRepository.create({
      tenantId: 'tenant-1',
      entryId: entry.id.toString(),
      bankAccountId: 'bank-account-1',
      method: 'PIX',
      amount: 1000,
      recipientData: { pixKey: 'recipient@email.com' },
      requestedById: 'user-requester',
    });

    const result = await sut.execute({
      orderId: order.id,
      tenantId: 'tenant-1',
      approvedById: 'user-approver',
    });

    expect(result.order.status).toBe('COMPLETED');
    expect(result.order.externalId).toBe('ext-123');
    expect(result.order.receiptData).toEqual({ confirmationCode: 'ABC123' });
    expect(result.order.approvedById).toBe('user-approver');
    expect(mockProvider.authenticate).toHaveBeenCalled();
    expect(mockProvider.executePixPayment).toHaveBeenCalled();

    // Verify the entry was marked as PAID
    const updatedEntry = await entriesRepository.findById(entry.id, 'tenant-1');
    expect(updatedEntry?.status).toBe('PAID');
  });

  it('should reject if approver is the same as requester', async () => {
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAY-002',
      description: 'Payment',
      categoryId: 'category-1',
      expectedAmount: 500,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
      status: 'PENDING',
    });

    const order = await paymentOrdersRepository.create({
      tenantId: 'tenant-1',
      entryId: entry.id.toString(),
      bankAccountId: 'bank-account-1',
      method: 'PIX',
      amount: 500,
      recipientData: { pixKey: 'test@test.com' },
      requestedById: 'same-user',
    });

    await expect(
      sut.execute({
        orderId: order.id,
        tenantId: 'tenant-1',
        approvedById: 'same-user',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should reject if order is not PENDING_APPROVAL', async () => {
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAY-003',
      description: 'Payment',
      categoryId: 'category-1',
      expectedAmount: 500,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
      status: 'PENDING',
    });

    const order = await paymentOrdersRepository.create({
      tenantId: 'tenant-1',
      entryId: entry.id.toString(),
      bankAccountId: 'bank-account-1',
      method: 'PIX',
      amount: 500,
      recipientData: {},
      requestedById: 'user-1',
    });

    // Manually set status to COMPLETED
    paymentOrdersRepository.items[0].status = 'COMPLETED';

    await expect(
      sut.execute({
        orderId: order.id,
        tenantId: 'tenant-1',
        approvedById: 'user-2',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should reject if order not found', async () => {
    await expect(
      sut.execute({
        orderId: 'non-existent',
        tenantId: 'tenant-1',
        approvedById: 'user-1',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should set FAILED if payment execution throws', async () => {
    const failingProvider = createMockBankingProvider({
      executePixPayment: vi
        .fn()
        .mockRejectedValue(new Error('Bank API timeout')),
    });

    sut = new ApprovePaymentOrderUseCase(
      paymentOrdersRepository,
      entriesRepository,
      async () => failingProvider,
    );

    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAY-004',
      description: 'Payment',
      categoryId: 'category-1',
      expectedAmount: 1000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
      status: 'PENDING',
    });

    const order = await paymentOrdersRepository.create({
      tenantId: 'tenant-1',
      entryId: entry.id.toString(),
      bankAccountId: 'bank-account-1',
      method: 'PIX',
      amount: 1000,
      recipientData: { pixKey: 'test@test.com' },
      requestedById: 'user-requester',
    });

    const result = await sut.execute({
      orderId: order.id,
      tenantId: 'tenant-1',
      approvedById: 'user-approver',
    });

    expect(result.order.status).toBe('FAILED');
    expect(result.order.errorMessage).toBe('Bank API timeout');

    // Entry should NOT be marked as PAID
    const updatedEntry = await entriesRepository.findById(entry.id, 'tenant-1');
    expect(updatedEntry?.status).toBe('PENDING');
  });

  it('should execute TED payment for non-PIX method', async () => {
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAY-005',
      description: 'TED payment',
      categoryId: 'category-1',
      expectedAmount: 2000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
      status: 'PENDING',
    });

    const order = await paymentOrdersRepository.create({
      tenantId: 'tenant-1',
      entryId: entry.id.toString(),
      bankAccountId: 'bank-account-1',
      method: 'TED',
      amount: 2000,
      recipientData: {
        bankCode: '001',
        agency: '1234',
        account: '56789',
        recipientName: 'John Doe',
      },
      requestedById: 'user-requester',
    });

    const result = await sut.execute({
      orderId: order.id,
      tenantId: 'tenant-1',
      approvedById: 'user-approver',
    });

    expect(result.order.status).toBe('COMPLETED');
    expect(mockProvider.executePayment).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'TED',
        amount: 2000,
        recipientBankCode: '001',
      }),
    );
  });
});
