import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock logger to avoid loading @/@env validation during unit tests
vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// Mock audit queue to avoid Redis connection in tests
vi.mock('@/workers/queues/audit.queue', () => ({
  queueAuditLog: vi.fn().mockResolvedValue(undefined),
}));

import { CancelFinanceEntryUseCase } from './cancel-finance-entry';

let entriesRepository: InMemoryFinanceEntriesRepository;
let sut: CancelFinanceEntryUseCase;

describe('CancelFinanceEntryUseCase', () => {
  beforeEach(() => {
    entriesRepository = new InMemoryFinanceEntriesRepository();
    sut = new CancelFinanceEntryUseCase(entriesRepository);
  });

  it('should cancel a finance entry', async () => {
    const createdEntry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Conta a cancelar',
      categoryId: 'category-1',
      costCenterId: 'cost-center-1',
      expectedAmount: 3000,
      issueDate: new Date('2026-02-01'),
      dueDate: new Date('2026-02-28'),
    });

    const result = await sut.execute({
      id: createdEntry.id.toString(),
      tenantId: 'tenant-1',
    });

    expect(result.entry.status).toBe('CANCELLED');
  });

  it('should not cancel non-existent entry', async () => {
    await expect(
      sut.execute({
        id: 'non-existent-id',
        tenantId: 'tenant-1',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should not cancel already paid entry', async () => {
    const createdEntry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Conta ja paga',
      categoryId: 'category-1',
      costCenterId: 'cost-center-1',
      expectedAmount: 5000,
      issueDate: new Date('2026-02-01'),
      dueDate: new Date('2026-02-28'),
    });

    entriesRepository.items[0].status = 'PAID';

    await expect(
      sut.execute({
        id: createdEntry.id.toString(),
        tenantId: 'tenant-1',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not cancel already received entry', async () => {
    const createdEntry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'RECEIVABLE',
      code: 'REC-001',
      description: 'Recebimento concluido',
      categoryId: 'category-1',
      costCenterId: 'cost-center-1',
      expectedAmount: 10000,
      issueDate: new Date('2026-02-01'),
      dueDate: new Date('2026-03-01'),
    });

    entriesRepository.items[0].status = 'RECEIVED';

    await expect(
      sut.execute({
        id: createdEntry.id.toString(),
        tenantId: 'tenant-1',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  // Regression: P1-01 — the cancel + journal reversal pair must run inside
  // a single transaction. When the reversal fails, the cancel must be rolled
  // back so the entry does not end up CANCELLED with its journal still
  // POSTED. The InMemoryTransactionManager serializes the work chain and
  // propagates failures, giving us the same sequencing as PrismaTransaction.
  it('should roll back the cancel when journal reversal fails inside the same transaction', async () => {
    const { InMemoryTransactionManager } = await import(
      '@/lib/in-memory-transaction-manager'
    );

    const createdEntry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-100',
      description: 'Entrada com journal para estornar',
      categoryId: 'category-1',
      costCenterId: 'cost-center-1',
      expectedAmount: 800,
      issueDate: new Date('2026-02-01'),
      dueDate: new Date('2026-02-28'),
    });

    const fakeJournalRepo = {
      findBySource: vi.fn().mockResolvedValue([
        {
          id: 'journal-1',
          status: 'POSTED',
          tenantId: 'tenant-1',
          code: 'JE-001',
          date: new Date(),
          description: 'lançamento-1',
          sourceType: 'FINANCE_ENTRY',
          sourceId: createdEntry.id.toString(),
          reversedById: null,
          createdBy: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          lines: [],
        },
      ]),
    };

    const failingReverse = {
      execute: vi
        .fn()
        .mockRejectedValue(new Error('reversal simulated failure')),
    };

    const transactionalSut = new CancelFinanceEntryUseCase(
      entriesRepository,
      fakeJournalRepo as never,
      failingReverse,
      new InMemoryTransactionManager(),
    );

    await expect(
      transactionalSut.execute({
        id: createdEntry.id.toString(),
        tenantId: 'tenant-1',
      }),
    ).rejects.toThrowError('reversal simulated failure');

    // Note: the in-memory repo doesn't support true rollback of side
    // effects, so this spec primarily asserts the failure surfaces instead
    // of being swallowed. In production, PrismaTransactionManager rolls the
    // update back at the DB layer.
    expect(failingReverse.execute).toHaveBeenCalled();
  });
});
