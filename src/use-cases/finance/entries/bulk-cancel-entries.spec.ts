import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import type { TransactionManager } from '@/lib/transaction-manager';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BulkCancelEntriesUseCase } from './bulk-cancel-entries';

vi.mock('@/workers/queues/audit.queue', () => ({
  queueAuditLog: vi.fn().mockResolvedValue(undefined),
}));

const fakeTransactionManager: TransactionManager = {
  run: async (fn) => fn({} as never),
};

let entriesRepository: InMemoryFinanceEntriesRepository;
let sut: BulkCancelEntriesUseCase;

describe('BulkCancelEntriesUseCase', () => {
  beforeEach(() => {
    entriesRepository = new InMemoryFinanceEntriesRepository();
    sut = new BulkCancelEntriesUseCase(
      entriesRepository,
      fakeTransactionManager,
    );
  });

  it('should cancel multiple entries successfully', async () => {
    const entry1 = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Conta pendente 1',
      categoryId: 'category-1',
      expectedAmount: 1000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
    });

    const entry2 = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-002',
      description: 'Conta pendente 2',
      categoryId: 'category-1',
      expectedAmount: 2000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      entryIds: [entry1.id.toString(), entry2.id.toString()],
    });

    expect(result.succeeded).toBe(2);
    expect(result.failed).toBe(0);

    const updated1 = await entriesRepository.findById(entry1.id, 'tenant-1');
    expect(updated1!.status).toBe('CANCELLED');

    const updated2 = await entriesRepository.findById(entry2.id, 'tenant-1');
    expect(updated2!.status).toBe('CANCELLED');
  });

  it('should skip already cancelled entries', async () => {
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Conta ja cancelada',
      categoryId: 'category-1',
      expectedAmount: 1000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
      status: 'CANCELLED',
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      entryIds: [entry.id.toString()],
    });

    expect(result.succeeded).toBe(0);
    expect(result.failed).toBe(1);
    expect(result.errors[0].error).toContain('CANCELLED');
  });

  it('should skip paid entries', async () => {
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Conta paga',
      categoryId: 'category-1',
      expectedAmount: 1000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
      status: 'PAID',
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      entryIds: [entry.id.toString()],
    });

    expect(result.succeeded).toBe(0);
    expect(result.failed).toBe(1);
    expect(result.errors[0].error).toContain('PAID');
  });

  it('should skip entries not found', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      entryIds: ['non-existent-id'],
    });

    expect(result.succeeded).toBe(0);
    expect(result.failed).toBe(1);
    expect(result.errors[0].error).toBe('Entry not found');
  });

  it('should handle mix of valid and invalid entries', async () => {
    const validEntry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Conta valida',
      categoryId: 'category-1',
      expectedAmount: 1000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
    });

    const paidEntry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-002',
      description: 'Conta paga',
      categoryId: 'category-1',
      expectedAmount: 500,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
      status: 'RECEIVED',
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      entryIds: [validEntry.id.toString(), paidEntry.id.toString()],
      reason: 'Cancellation reason',
    });

    expect(result.succeeded).toBe(1);
    expect(result.failed).toBe(1);
  });
});
