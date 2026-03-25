import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryFinanceCategoriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-categories-repository';
import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import type { TransactionManager } from '@/lib/transaction-manager';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BulkCategorizeEntriesUseCase } from './bulk-categorize-entries';

vi.mock('@/workers/queues/audit.queue', () => ({
  queueAuditLog: vi.fn().mockResolvedValue(undefined),
}));

const fakeTransactionManager: TransactionManager = {
  run: async (fn) => fn({} as never),
};

let entriesRepository: InMemoryFinanceEntriesRepository;
let categoriesRepository: InMemoryFinanceCategoriesRepository;
let sut: BulkCategorizeEntriesUseCase;

describe('BulkCategorizeEntriesUseCase', () => {
  beforeEach(() => {
    entriesRepository = new InMemoryFinanceEntriesRepository();
    categoriesRepository = new InMemoryFinanceCategoriesRepository();
    sut = new BulkCategorizeEntriesUseCase(
      entriesRepository,
      categoriesRepository,
      fakeTransactionManager,
    );
  });

  it('should categorize multiple entries successfully', async () => {
    const category = await categoriesRepository.create({
      tenantId: 'tenant-1',
      name: 'Nova Categoria',
      slug: 'nova-categoria',
      type: 'EXPENSE',
    });

    const entry1 = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Conta 1',
      categoryId: 'old-category',
      expectedAmount: 1000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
    });

    const entry2 = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-002',
      description: 'Conta 2',
      categoryId: 'old-category',
      expectedAmount: 2000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      entryIds: [entry1.id.toString(), entry2.id.toString()],
      categoryId: category.id.toString(),
    });

    expect(result.succeeded).toBe(2);
    expect(result.failed).toBe(0);

    const updated1 = await entriesRepository.findById(entry1.id, 'tenant-1');
    expect(updated1!.categoryId.toString()).toBe(category.id.toString());

    const updated2 = await entriesRepository.findById(entry2.id, 'tenant-1');
    expect(updated2!.categoryId.toString()).toBe(category.id.toString());
  });

  it('should throw if category not found', async () => {
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Conta 1',
      categoryId: 'old-category',
      expectedAmount: 1000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        entryIds: [entry.id.toString()],
        categoryId: 'non-existent-category',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should throw if category is inactive', async () => {
    const category = await categoriesRepository.create({
      tenantId: 'tenant-1',
      name: 'Categoria Inativa',
      slug: 'categoria-inativa',
      type: 'EXPENSE',
      isActive: false,
    });

    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Conta 1',
      categoryId: 'old-category',
      expectedAmount: 1000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        entryIds: [entry.id.toString()],
        categoryId: category.id.toString(),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should skip entries not found', async () => {
    const category = await categoriesRepository.create({
      tenantId: 'tenant-1',
      name: 'Categoria',
      slug: 'categoria',
      type: 'EXPENSE',
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      entryIds: ['non-existent-id'],
      categoryId: category.id.toString(),
    });

    expect(result.succeeded).toBe(0);
    expect(result.failed).toBe(1);
    expect(result.errors[0].error).toBe('Entry not found');
  });

  it('should not categorize entries from another tenant', async () => {
    const category = await categoriesRepository.create({
      tenantId: 'tenant-1',
      name: 'Categoria',
      slug: 'categoria',
      type: 'EXPENSE',
    });

    const entry = await entriesRepository.create({
      tenantId: 'tenant-other',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Conta de outro tenant',
      categoryId: 'old-category',
      expectedAmount: 1000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      entryIds: [entry.id.toString()],
      categoryId: category.id.toString(),
    });

    expect(result.succeeded).toBe(0);
    expect(result.failed).toBe(1);
    expect(result.errors[0].error).toBe('Entry not found');
  });
});
