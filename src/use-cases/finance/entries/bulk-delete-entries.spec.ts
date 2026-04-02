import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import { InMemoryFinanceApprovalRulesRepository } from '@/repositories/finance/in-memory/in-memory-finance-approval-rules-repository';
import type { TransactionManager } from '@/lib/transaction-manager';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BulkDeleteEntriesUseCase } from './bulk-delete-entries';

vi.mock('@/workers/queues/audit.queue', () => ({
  queueAuditLog: vi.fn().mockResolvedValue(undefined),
}));

const fakeTransactionManager: TransactionManager = {
  run: async (fn) => fn({} as never),
};

let entriesRepository: InMemoryFinanceEntriesRepository;
let sut: BulkDeleteEntriesUseCase;

describe('BulkDeleteEntriesUseCase', () => {
  beforeEach(() => {
    entriesRepository = new InMemoryFinanceEntriesRepository();
    sut = new BulkDeleteEntriesUseCase(
      entriesRepository,
      fakeTransactionManager,
    );
  });

  it('should delete multiple entries successfully', async () => {
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

    // Entries should be soft-deleted (not found by findById)
    const deleted1 = await entriesRepository.findById(entry1.id, 'tenant-1');
    expect(deleted1).toBeNull();

    const deleted2 = await entriesRepository.findById(entry2.id, 'tenant-1');
    expect(deleted2).toBeNull();
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

  it('should skip received entries', async () => {
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'RECEIVABLE',
      code: 'REC-001',
      description: 'Recebimento concluido',
      categoryId: 'category-1',
      expectedAmount: 1000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
      status: 'RECEIVED',
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      entryIds: [entry.id.toString()],
    });

    expect(result.succeeded).toBe(0);
    expect(result.failed).toBe(1);
    expect(result.errors[0].error).toContain('RECEIVED');
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

  it('should allow deleting cancelled entries', async () => {
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Conta cancelada',
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

    expect(result.succeeded).toBe(1);
    expect(result.failed).toBe(0);
  });

  it('should reject deletion when entry requires approval', async () => {
    const approvalRulesRepository =
      new InMemoryFinanceApprovalRulesRepository();
    const sutWithApproval = new BulkDeleteEntriesUseCase(
      entriesRepository,
      fakeTransactionManager,
      approvalRulesRepository,
    );

    await approvalRulesRepository.create({
      tenantId: 'tenant-1',
      name: 'Regra de aprovacao',
      action: 'FLAG_REVIEW',
      maxAmount: 10000,
      isActive: true,
      priority: 1,
    });

    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Conta pendente aprovacao',
      categoryId: 'category-1',
      expectedAmount: 5000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
      status: 'PENDING',
    });

    const result = await sutWithApproval.execute({
      tenantId: 'tenant-1',
      entryIds: [entry.id.toString()],
    });

    expect(result.failed).toBe(1);
    expect(result.succeeded).toBe(0);
    expect(result.errors[0].error).toContain('aprovacao');
  });

  it('should allow deletion when entry has manually-approved tag', async () => {
    const approvalRulesRepository =
      new InMemoryFinanceApprovalRulesRepository();
    const sutWithApproval = new BulkDeleteEntriesUseCase(
      entriesRepository,
      fakeTransactionManager,
      approvalRulesRepository,
    );

    await approvalRulesRepository.create({
      tenantId: 'tenant-1',
      name: 'Regra de aprovacao',
      action: 'FLAG_REVIEW',
      maxAmount: 10000,
      isActive: true,
      priority: 1,
    });

    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Conta aprovada manualmente',
      categoryId: 'category-1',
      expectedAmount: 5000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
      status: 'PENDING',
      tags: ['manually-approved'],
    });

    const result = await sutWithApproval.execute({
      tenantId: 'tenant-1',
      entryIds: [entry.id.toString()],
    });

    expect(result.succeeded).toBe(1);
    expect(result.failed).toBe(0);
  });
});
