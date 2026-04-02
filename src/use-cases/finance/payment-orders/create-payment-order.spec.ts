import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryBankAccountsRepository } from '@/repositories/finance/in-memory/in-memory-bank-accounts-repository';
import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import { InMemoryPaymentOrdersRepository } from '@/repositories/finance/in-memory/in-memory-payment-orders-repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreatePaymentOrderUseCase } from './create-payment-order';

// Mock audit queue to avoid Redis connection in tests
vi.mock('@/workers/queues/audit.queue', () => ({
  queueAuditLog: vi.fn().mockResolvedValue(undefined),
}));

let paymentOrdersRepository: InMemoryPaymentOrdersRepository;
let entriesRepository: InMemoryFinanceEntriesRepository;
let bankAccountsRepository: InMemoryBankAccountsRepository;
let sut: CreatePaymentOrderUseCase;

describe('CreatePaymentOrderUseCase', () => {
  beforeEach(() => {
    paymentOrdersRepository = new InMemoryPaymentOrdersRepository();
    entriesRepository = new InMemoryFinanceEntriesRepository();
    bankAccountsRepository = new InMemoryBankAccountsRepository();
    sut = new CreatePaymentOrderUseCase(
      paymentOrdersRepository,
      entriesRepository,
      bankAccountsRepository,
    );
  });

  it('should create a payment order for a PENDING entry', async () => {
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

    // Create a bank account with API enabled
    const bankAccount = await bankAccountsRepository.create({
      tenantId: 'tenant-1',
      name: 'Main Account',
      bankCode: '756',
      agency: '3001',
      accountNumber: '123456',
      accountType: 'CHECKING',
      apiEnabled: true,
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      entryId: entry.id.toString(),
      bankAccountId: bankAccount.id.toString(),
      method: 'PIX',
      amount: 1000,
      recipientData: { pixKey: 'recipient@email.com' },
      requestedById: 'user-1',
    });

    expect(result.order).toBeTruthy();
    expect(result.order.status).toBe('PENDING_APPROVAL');
    expect(result.order.entryId).toBe(entry.id.toString());
    expect(result.order.bankAccountId).toBe(bankAccount.id.toString());
    expect(result.order.method).toBe('PIX');
    expect(result.order.amount).toBe(1000);
    expect(result.order.requestedById).toBe('user-1');
    expect(paymentOrdersRepository.items).toHaveLength(1);
  });

  it('should create a payment order for an OVERDUE entry', async () => {
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAY-002',
      description: 'Overdue payment',
      categoryId: 'category-1',
      expectedAmount: 500,
      issueDate: new Date('2025-01-01'),
      dueDate: new Date('2025-02-01'),
      status: 'OVERDUE',
    });

    const bankAccount = await bankAccountsRepository.create({
      tenantId: 'tenant-1',
      name: 'Main Account',
      bankCode: '756',
      agency: '3001',
      accountNumber: '123456',
      accountType: 'CHECKING',
      apiEnabled: true,
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      entryId: entry.id.toString(),
      bankAccountId: bankAccount.id.toString(),
      method: 'TED',
      amount: 500,
      recipientData: { bankCode: '001', agency: '1234', account: '56789' },
      requestedById: 'user-1',
    });

    expect(result.order.status).toBe('PENDING_APPROVAL');
    expect(result.order.method).toBe('TED');
  });

  it('should reject if entry not found', async () => {
    const bankAccount = await bankAccountsRepository.create({
      tenantId: 'tenant-1',
      name: 'Main Account',
      bankCode: '756',
      agency: '3001',
      accountNumber: '123456',
      accountType: 'CHECKING',
      apiEnabled: true,
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        entryId: 'non-existent-entry',
        bankAccountId: bankAccount.id.toString(),
        method: 'PIX',
        amount: 1000,
        recipientData: {},
        requestedById: 'user-1',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should reject if entry is PAID', async () => {
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAY-003',
      description: 'Already paid',
      categoryId: 'category-1',
      expectedAmount: 1000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
      status: 'PAID',
    });

    const bankAccount = await bankAccountsRepository.create({
      tenantId: 'tenant-1',
      name: 'Main Account',
      bankCode: '756',
      agency: '3001',
      accountNumber: '123456',
      accountType: 'CHECKING',
      apiEnabled: true,
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        entryId: entry.id.toString(),
        bankAccountId: bankAccount.id.toString(),
        method: 'PIX',
        amount: 1000,
        recipientData: {},
        requestedById: 'user-1',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should reject if entry is CANCELLED', async () => {
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAY-004',
      description: 'Cancelled entry',
      categoryId: 'category-1',
      expectedAmount: 1000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
      status: 'CANCELLED',
    });

    const bankAccount = await bankAccountsRepository.create({
      tenantId: 'tenant-1',
      name: 'Main Account',
      bankCode: '756',
      agency: '3001',
      accountNumber: '123456',
      accountType: 'CHECKING',
      apiEnabled: true,
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        entryId: entry.id.toString(),
        bankAccountId: bankAccount.id.toString(),
        method: 'PIX',
        amount: 1000,
        recipientData: {},
        requestedById: 'user-1',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should reject if bank account not found', async () => {
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAY-005',
      description: 'Payment',
      categoryId: 'category-1',
      expectedAmount: 1000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
      status: 'PENDING',
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        entryId: entry.id.toString(),
        bankAccountId: 'non-existent-bank-account',
        method: 'PIX',
        amount: 1000,
        recipientData: {},
        requestedById: 'user-1',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should reject if bank account has no API integration enabled', async () => {
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAY-007',
      description: 'Payment',
      categoryId: 'category-1',
      expectedAmount: 1000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
      status: 'PENDING',
    });

    // Bank account with apiEnabled: false (default)
    const bankAccount = await bankAccountsRepository.create({
      tenantId: 'tenant-1',
      name: 'Account Without API',
      bankCode: '756',
      agency: '3001',
      accountNumber: '123456',
      accountType: 'CHECKING',
      apiEnabled: false,
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        entryId: entry.id.toString(),
        bankAccountId: bankAccount.id.toString(),
        method: 'PIX',
        amount: 1000,
        recipientData: {},
        requestedById: 'user-1',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should reject if bank account is inactive', async () => {
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAY-006',
      description: 'Payment',
      categoryId: 'category-1',
      expectedAmount: 1000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
      status: 'PENDING',
    });

    const bankAccount = await bankAccountsRepository.create({
      tenantId: 'tenant-1',
      name: 'Inactive Account',
      bankCode: '756',
      agency: '3001',
      accountNumber: '123456',
      accountType: 'CHECKING',
      apiEnabled: true,
    });

    // Manually set to inactive
    bankAccount.inactivate();

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        entryId: entry.id.toString(),
        bankAccountId: bankAccount.id.toString(),
        method: 'PIX',
        amount: 1000,
        recipientData: {},
        requestedById: 'user-1',
      }),
    ).rejects.toThrow(BadRequestError);
  });
});
