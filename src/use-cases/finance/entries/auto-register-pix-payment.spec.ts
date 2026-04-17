import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import { InMemoryFinanceEntryPaymentsRepository } from '@/repositories/finance/in-memory/in-memory-finance-entry-payments-repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AutoRegisterPixPaymentUseCase } from './auto-register-pix-payment';

vi.mock('@/workers/queues/audit.queue', () => ({
  queueAuditLog: vi.fn().mockResolvedValue(undefined),
}));

// Mock prisma and the mapper used inside findEntryByPixChargeTxId
vi.mock('@/lib/prisma', () => ({
  prisma: {
    financeEntry: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock(
  '@/mappers/finance/finance-entry/finance-entry-prisma-to-domain',
  () => ({
    financeEntryPrismaToDomain: vi.fn(),
  }),
);

let entriesRepository: InMemoryFinanceEntriesRepository;
let paymentsRepository: InMemoryFinanceEntryPaymentsRepository;
let sut: AutoRegisterPixPaymentUseCase;

describe('AutoRegisterPixPaymentUseCase', () => {
  beforeEach(async () => {
    entriesRepository = new InMemoryFinanceEntriesRepository();
    paymentsRepository = new InMemoryFinanceEntryPaymentsRepository();
    sut = new AutoRegisterPixPaymentUseCase(
      entriesRepository,
      paymentsRepository,
    );
    vi.clearAllMocks();
  });

  it('should return registered: false when no entry linked to txId', async () => {
    const { prisma } = await import('@/lib/prisma');
    vi.mocked(prisma.financeEntry.findFirst).mockResolvedValue(null);

    const result = await sut.execute({
      txId: 'tx-not-found',
      amount: 100,
      paidAt: new Date('2026-01-15'),
    });

    expect(result.registered).toBe(false);
    expect(result.entry).toBeUndefined();
  });

  it('should auto-register payment and mark entry as RECEIVED when fully paid', async () => {
    // Create a real entry in memory
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'RECEIVABLE',
      code: 'REC-001',
      description: 'Cobrança PIX',
      categoryId: 'category-1',
      expectedAmount: 200,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
    });

    // Mock prisma returning a raw record
    const { prisma } = await import('@/lib/prisma');
    const mockRawRecord = { id: entry.id.toString(), tenantId: 'tenant-1' };
    vi.mocked(prisma.financeEntry.findFirst).mockResolvedValue(
      mockRawRecord as never,
    );

    // Mock mapper returning the domain entity
    const { financeEntryPrismaToDomain } = await import(
      '@/mappers/finance/finance-entry/finance-entry-prisma-to-domain'
    );
    vi.mocked(financeEntryPrismaToDomain).mockReturnValue(entry);

    const result = await sut.execute({
      txId: 'tx-abc-123',
      amount: 200,
      paidAt: new Date('2026-01-20'),
      payerName: 'João Silva',
      endToEndId: 'E00000000202601200000',
    });

    expect(result.registered).toBe(true);
    expect(result.entry).toBeDefined();
    expect(result.entry!.status).toBe('RECEIVED');
    expect(paymentsRepository.items).toHaveLength(1);
    expect(paymentsRepository.items[0].amount).toBe(200);
    expect(paymentsRepository.items[0].method).toBe('PIX');
  });

  it('should mark entry as PARTIALLY_PAID when amount is less than total due', async () => {
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'RECEIVABLE',
      code: 'REC-002',
      description: 'Cobrança parcial',
      categoryId: 'category-1',
      expectedAmount: 500,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
    });

    const { prisma } = await import('@/lib/prisma');
    vi.mocked(prisma.financeEntry.findFirst).mockResolvedValue({
      id: entry.id.toString(),
    } as never);

    const { financeEntryPrismaToDomain } = await import(
      '@/mappers/finance/finance-entry/finance-entry-prisma-to-domain'
    );
    vi.mocked(financeEntryPrismaToDomain).mockReturnValue(entry);

    const result = await sut.execute({
      txId: 'tx-partial',
      amount: 200,
      paidAt: new Date('2026-01-20'),
    });

    expect(result.registered).toBe(true);
    expect(result.entry!.status).toBe('PARTIALLY_PAID');
  });

  // P3-29: the PIX webhook may legitimately be re-delivered with the same
  // endToEndId (bank retries after timeout, operator reprocessing, etc.).
  // When a prior payment covering the same amount has already been
  // recorded, the use case must detect the totalDue is already met inside
  // the locked critical section and bail WITHOUT creating a duplicate
  // payment — protecting against double-settlement.
  it('should not create a duplicate payment when endToEndId webhook is redelivered after full settlement', async () => {
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'RECEIVABLE',
      code: 'REC-IDEMP',
      description: 'Cobrança com retry',
      categoryId: 'category-1',
      expectedAmount: 100,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
    });

    // Simulate a prior successful PIX payment recorded with the same
    // endToEndId. The second webhook delivery must find totalDue already
    // met and refuse to create another payment.
    await paymentsRepository.create({
      entryId: entry.id.toString(),
      amount: 100,
      paidAt: new Date('2026-01-20'),
      method: 'PIX',
      reference: 'E00000000202601200000',
    });
    entry.status = 'RECEIVED';

    const { prisma } = await import('@/lib/prisma');
    vi.mocked(prisma.financeEntry.findFirst).mockResolvedValue({
      id: entry.id.toString(),
    } as never);

    const { financeEntryPrismaToDomain } = await import(
      '@/mappers/finance/finance-entry/finance-entry-prisma-to-domain'
    );
    vi.mocked(financeEntryPrismaToDomain).mockReturnValue(entry);

    const result = await sut.execute({
      txId: 'tx-retry',
      amount: 100,
      paidAt: new Date('2026-01-20'),
      endToEndId: 'E00000000202601200000',
    });

    // Entry stayed at RECEIVED (already-settled short-circuit)
    expect(result.registered).toBe(false);
    // Exactly one payment remains — not two.
    expect(paymentsRepository.items).toHaveLength(1);
  });

  it('should return registered: false when entry is already RECEIVED', async () => {
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'RECEIVABLE',
      code: 'REC-003',
      description: 'Já recebida',
      categoryId: 'category-1',
      expectedAmount: 100,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
      status: 'RECEIVED',
    });

    const { prisma } = await import('@/lib/prisma');
    vi.mocked(prisma.financeEntry.findFirst).mockResolvedValue({
      id: entry.id.toString(),
    } as never);

    const { financeEntryPrismaToDomain } = await import(
      '@/mappers/finance/finance-entry/finance-entry-prisma-to-domain'
    );
    vi.mocked(financeEntryPrismaToDomain).mockReturnValue(entry);

    const result = await sut.execute({
      txId: 'tx-already-paid',
      amount: 100,
      paidAt: new Date('2026-01-20'),
    });

    expect(result.registered).toBe(false);
    expect(paymentsRepository.items).toHaveLength(0);
  });
});
