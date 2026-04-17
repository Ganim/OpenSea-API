import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { InMemoryTransactionManager } from '@/lib/in-memory-transaction-manager';
import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import { InMemoryFinanceEntryPaymentsRepository } from '@/repositories/finance/in-memory/in-memory-finance-entry-payments-repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock logger to avoid loading @/@env validation during unit tests
vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// Mock audit queue to avoid Redis connection in tests
vi.mock('@/workers/queues/audit.queue', () => ({
  queueAuditLog: vi.fn().mockResolvedValue(undefined),
}));

import { RegisterPaymentUseCase } from './register-payment';

let entriesRepository: InMemoryFinanceEntriesRepository;
let paymentsRepository: InMemoryFinanceEntryPaymentsRepository;
let transactionManager: InMemoryTransactionManager;
let sut: RegisterPaymentUseCase;

describe('Register Payment - Concurrency', () => {
  beforeEach(() => {
    entriesRepository = new InMemoryFinanceEntriesRepository();
    paymentsRepository = new InMemoryFinanceEntryPaymentsRepository();
    transactionManager = new InMemoryTransactionManager();
    sut = new RegisterPaymentUseCase(
      entriesRepository,
      paymentsRepository,
      undefined, // calendarSyncService
      undefined, // categoriesRepository
      transactionManager,
    );
  });

  it('should reject the second of two concurrent full payments', async () => {
    // Two PIX webhooks arrive within the same tick for the same entry.
    // With Serializable isolation + SELECT FOR UPDATE in production, only
    // one transaction wins; the other reads the freshly committed state
    // and fails the totalDue guard.
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Double payment guard',
      categoryId: 'category-1',
      expectedAmount: 1000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
    });

    const entryId = entry.id.toString();

    const results = await Promise.allSettled([
      sut.execute({
        entryId,
        tenantId: 'tenant-1',
        amount: 1000,
        paidAt: new Date('2026-01-15'),
        method: 'PIX',
      }),
      sut.execute({
        entryId,
        tenantId: 'tenant-1',
        amount: 1000,
        paidAt: new Date('2026-01-15'),
        method: 'BANK_TRANSFER',
      }),
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(
      BadRequestError,
    );

    // Total paid must equal totalDue exactly — no overpayment.
    const totalPaid = await paymentsRepository.sumByEntryId(entry.id);
    expect(totalPaid).toBe(1000);
  });

  it('should allow concurrent partial payments only up to the remaining balance', async () => {
    // 600 + 600 against a 1000 entry: serialized, the first commits 600,
    // the second sees sum=600 and rejects (would push total to 1200).
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-002',
      description: 'Concurrent partial payments',
      categoryId: 'category-1',
      expectedAmount: 1000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
    });

    const entryId = entry.id.toString();

    const results = await Promise.allSettled([
      sut.execute({
        entryId,
        tenantId: 'tenant-1',
        amount: 600,
        paidAt: new Date('2026-01-15'),
        method: 'PIX',
      }),
      sut.execute({
        entryId,
        tenantId: 'tenant-1',
        amount: 600,
        paidAt: new Date('2026-01-15'),
        method: 'BANK_TRANSFER',
      }),
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    const totalPaid = await paymentsRepository.sumByEntryId(entry.id);
    expect(totalPaid).toBe(600);
  });

  it('should reject a payment that arrives after entry is already fully paid', async () => {
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-003',
      description: 'Already paid entry',
      categoryId: 'category-1',
      expectedAmount: 500,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
    });

    // First payment succeeds
    await sut.execute({
      entryId: entry.id.toString(),
      tenantId: 'tenant-1',
      amount: 500,
      paidAt: new Date('2026-01-15'),
      method: 'PIX',
    });

    // Second payment should be rejected because entry is already PAID
    await expect(
      sut.execute({
        entryId: entry.id.toString(),
        tenantId: 'tenant-1',
        amount: 500,
        paidAt: new Date('2026-01-16'),
        method: 'PIX',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should allow only payments that do not exceed totalDue across 3 concurrent attempts', async () => {
    // With the transaction manager serializing access, the third payment of
    // R$400 (which would push total to R$1200, exceeding R$1000) is rejected.
    // The first two payments (R$800 total) fit within the limit and succeed.
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'RECEIVABLE',
      code: 'REC-001',
      description: 'Triple concurrent payments',
      categoryId: 'category-1',
      expectedAmount: 1000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
    });

    const entryId = entry.id.toString();

    const results = await Promise.allSettled([
      sut.execute({
        entryId,
        tenantId: 'tenant-1',
        amount: 400,
        paidAt: new Date('2026-01-15'),
        method: 'PIX',
      }),
      sut.execute({
        entryId,
        tenantId: 'tenant-1',
        amount: 400,
        paidAt: new Date('2026-01-15'),
        method: 'BANK_TRANSFER',
      }),
      sut.execute({
        entryId,
        tenantId: 'tenant-1',
        amount: 400,
        paidAt: new Date('2026-01-15'),
        method: 'CASH',
      }),
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    expect(fulfilled).toHaveLength(2);
    expect(rejected).toHaveLength(1);
    expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(
      BadRequestError,
    );

    const totalPaid = await paymentsRepository.sumByEntryId(entry.id);
    expect(totalPaid).toBe(800);
  });

  it('should allow sequential partial payments that sum to exactly totalDue', async () => {
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-004',
      description: 'Sequential partial payments',
      categoryId: 'category-1',
      expectedAmount: 1000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
    });

    const entryId = entry.id.toString();

    // First partial payment
    const r1 = await sut.execute({
      entryId,
      tenantId: 'tenant-1',
      amount: 300,
      paidAt: new Date('2026-01-10'),
      method: 'PIX',
    });
    expect(r1.entry.status).toBe('PARTIALLY_PAID');

    // Second partial payment
    const r2 = await sut.execute({
      entryId,
      tenantId: 'tenant-1',
      amount: 300,
      paidAt: new Date('2026-01-15'),
      method: 'PIX',
    });
    expect(r2.entry.status).toBe('PARTIALLY_PAID');

    // Final payment — exact remaining balance
    const r3 = await sut.execute({
      entryId,
      tenantId: 'tenant-1',
      amount: 400,
      paidAt: new Date('2026-01-20'),
      method: 'PIX',
    });
    expect(r3.entry.status).toBe('PAID');
    expect(r3.entry.actualAmount).toBe(1000);

    // Further payment should fail
    await expect(
      sut.execute({
        entryId,
        tenantId: 'tenant-1',
        amount: 1,
        paidAt: new Date('2026-01-21'),
        method: 'PIX',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should reject overpayment even by a single cent after partial payments', async () => {
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-005',
      description: 'Overpayment by one cent',
      categoryId: 'category-1',
      expectedAmount: 100,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
    });

    const entryId = entry.id.toString();

    // Pay 99.99
    await sut.execute({
      entryId,
      tenantId: 'tenant-1',
      amount: 99.99,
      paidAt: new Date('2026-01-15'),
      method: 'PIX',
    });

    // Try to pay 0.02 (remaining is 0.01) — should fail
    await expect(
      sut.execute({
        entryId,
        tenantId: 'tenant-1',
        amount: 0.02,
        paidAt: new Date('2026-01-16'),
        method: 'PIX',
      }),
    ).rejects.toThrow(BadRequestError);

    // Pay exact remaining 0.01
    const result = await sut.execute({
      entryId,
      tenantId: 'tenant-1',
      amount: 0.01,
      paidAt: new Date('2026-01-16'),
      method: 'PIX',
    });
    expect(result.entry.status).toBe('PAID');
  });
});
