import { beforeEach, describe, expect, it } from 'vitest';
import { GetLastSupplierEntryUseCase } from './get-last-supplier-entry';
import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';

describe('GetLastSupplierEntryUseCase', () => {
  let sut: GetLastSupplierEntryUseCase;
  let financeEntriesRepository: InMemoryFinanceEntriesRepository;

  beforeEach(() => {
    financeEntriesRepository = new InMemoryFinanceEntriesRepository();
    sut = new GetLastSupplierEntryUseCase(financeEntriesRepository);
  });

  it('should return category and cost center from last entry for a supplier', async () => {
    // Create an older entry
    await financeEntriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAY-001',
      description: 'Old payment',
      categoryId: 'old-category-id',
      costCenterId: 'old-cc-id',
      supplierName: 'Fornecedor ABC',
      expectedAmount: 100,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-01-15'),
    });

    // Create a newer entry
    await financeEntriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAY-002',
      description: 'Recent payment',
      categoryId: 'new-category-id',
      costCenterId: 'new-cc-id',
      supplierName: 'Fornecedor ABC',
      expectedAmount: 200,
      issueDate: new Date('2026-02-01'),
      dueDate: new Date('2026-02-15'),
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      supplierName: 'Fornecedor ABC',
    });

    expect(result).not.toBeNull();
    expect(result!.categoryId).toBe('new-category-id');
    expect(result!.costCenterId).toBe('new-cc-id');
  });

  it('should return null when no entry exists for that supplier', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      supplierName: 'Fornecedor Desconhecido',
    });

    expect(result).toBeNull();
  });

  it('should filter by tenantId (multi-tenant isolation)', async () => {
    await financeEntriesRepository.create({
      tenantId: 'tenant-other',
      type: 'PAYABLE',
      code: 'PAY-001',
      description: 'Other tenant payment',
      categoryId: 'cat-other',
      costCenterId: 'cc-other',
      supplierName: 'Fornecedor ABC',
      expectedAmount: 100,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-01-15'),
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      supplierName: 'Fornecedor ABC',
    });

    expect(result).toBeNull();
  });

  it('should return entry without cost center if none was set', async () => {
    await financeEntriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAY-001',
      description: 'Payment without CC',
      categoryId: 'some-category-id',
      supplierName: 'Fornecedor XYZ',
      expectedAmount: 500,
      issueDate: new Date('2026-03-01'),
      dueDate: new Date('2026-03-15'),
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      supplierName: 'Fornecedor XYZ',
    });

    expect(result).not.toBeNull();
    expect(result!.categoryId).toBe('some-category-id');
    expect(result!.costCenterId).toBeUndefined();
  });
});
