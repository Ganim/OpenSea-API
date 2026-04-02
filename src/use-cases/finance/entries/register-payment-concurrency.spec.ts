import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import { InMemoryFinanceEntryPaymentsRepository } from '@/repositories/finance/in-memory/in-memory-finance-entry-payments-repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RegisterPaymentUseCase } from './register-payment';

// Mock audit queue to avoid Redis connection in tests
vi.mock('@/workers/queues/audit.queue', () => ({
  queueAuditLog: vi.fn().mockResolvedValue(undefined),
}));

let entriesRepository: InMemoryFinanceEntriesRepository;
let paymentsRepository: InMemoryFinanceEntryPaymentsRepository;
let sut: RegisterPaymentUseCase;

describe('Register Payment - Concurrency', () => {
  beforeEach(() => {
    entriesRepository = new InMemoryFinanceEntriesRepository();
    paymentsRepository = new InMemoryFinanceEntryPaymentsRepository();
    sut = new RegisterPaymentUseCase(entriesRepository, paymentsRepository);
  });

  it('should allow double-payment in-memory (documents lack of DB-level locking)', async () => {
    // IMPORTANT: This test documents that the in-memory repository has NO
    // concurrency control. In production, PostgreSQL row-level locking
    // (SELECT FOR UPDATE or serializable isolation) should prevent this.
    // The test serves as a regression marker: if concurrency control is
    // added to the use case layer, this test should be updated.
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Double payment test',
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

    // Both succeed because the in-memory repo reads stale state for both calls
    // before either writes. This is a concurrency gap that DB locking would fix.
    expect(fulfilled).toHaveLength(2);

    // Document the overpayment: totalPaid = 2000 but totalDue = 1000
    const totalPaid = await paymentsRepository.sumByEntryId(entry.id);
    expect(totalPaid).toBe(2000);

    // BUG: In production, this must be prevented by database-level locking
  });

  it('should allow concurrent partial overpayments in-memory (documents concurrency gap)', async () => {
    // IMPORTANT: Documents the same concurrency gap as the double-payment test.
    // Both calls read sumByEntryId=0 before either creates a payment record,
    // so both pass the overpayment check.
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

    // Both succeed in-memory — concurrency gap
    expect(fulfilled).toHaveLength(2);

    // Total overpaid: 1200 > 1000
    const totalPaid = await paymentsRepository.sumByEntryId(entry.id);
    expect(totalPaid).toBe(1200);

    // BUG: In production, DB locking must prevent this
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

  it('should allow triple concurrent overpayments in-memory (documents concurrency gap)', async () => {
    // IMPORTANT: Documents that 3 concurrent payments all read stale sum=0
    // and all pass the overpayment guard. In production, only 2 should succeed
    // (400+400=800 <= 1000), the third should be rejected.
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

    // All 3 succeed in-memory — concurrency gap
    expect(fulfilled).toHaveLength(3);
    const totalPaid = await paymentsRepository.sumByEntryId(entry.id);
    expect(totalPaid).toBe(1200);

    // BUG: In production, DB locking must limit to at most 2 successful payments
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
