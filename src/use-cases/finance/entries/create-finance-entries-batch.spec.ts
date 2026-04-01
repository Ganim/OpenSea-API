import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { InMemoryCostCentersRepository } from '@/repositories/finance/in-memory/in-memory-cost-centers-repository';
import { InMemoryFinanceCategoriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-categories-repository';
import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import { InMemoryFinanceEntryCostCentersRepository } from '@/repositories/finance/in-memory/in-memory-finance-entry-cost-centers-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateFinanceEntriesBatchUseCase } from './create-finance-entries-batch';
import { CreateFinanceEntryUseCase } from './create-finance-entry';

let entriesRepository: InMemoryFinanceEntriesRepository;
let categoriesRepository: InMemoryFinanceCategoriesRepository;
let costCentersRepository: InMemoryCostCentersRepository;
let costCenterAllocationsRepository: InMemoryFinanceEntryCostCentersRepository;
let createEntryUseCase: CreateFinanceEntryUseCase;
let sut: CreateFinanceEntriesBatchUseCase;

let seededCategoryId: string;
let seededRevenueCategoryId: string;
let seededCostCenterId: string;

describe('CreateFinanceEntriesBatchUseCase', () => {
  beforeEach(async () => {
    entriesRepository = new InMemoryFinanceEntriesRepository();
    categoriesRepository = new InMemoryFinanceCategoriesRepository();
    costCentersRepository = new InMemoryCostCentersRepository();
    costCenterAllocationsRepository =
      new InMemoryFinanceEntryCostCentersRepository();

    createEntryUseCase = new CreateFinanceEntryUseCase(
      entriesRepository,
      categoriesRepository,
      costCentersRepository,
      undefined, // calendarSyncService
      undefined, // transactionManager
      costCenterAllocationsRepository,
    );

    sut = new CreateFinanceEntriesBatchUseCase(createEntryUseCase);

    // Seed an EXPENSE category (for PAYABLE entries)
    const expenseCategory = await categoriesRepository.create({
      tenantId: 'tenant-1',
      name: 'Fornecedores',
      slug: 'fornecedores',
      type: 'EXPENSE',
      isActive: true,
    });
    seededCategoryId = expenseCategory.id.toString();

    // Seed a REVENUE category (for RECEIVABLE entries)
    const revenueCategory = await categoriesRepository.create({
      tenantId: 'tenant-1',
      name: 'Vendas',
      slug: 'vendas',
      type: 'REVENUE',
      isActive: true,
    });
    seededRevenueCategoryId = revenueCategory.id.toString();

    // Seed a valid cost center (required by CreateFinanceEntryUseCase)
    const costCenter = await costCentersRepository.create({
      tenantId: 'tenant-1',
      code: 'CC-001',
      name: 'Administrativo',
    });
    seededCostCenterId = costCenter.id.toString();
  });

  it('should create multiple entries in batch', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      entries: [
        {
          type: 'PAYABLE',
          description: 'Fornecedor A',
          categoryId: seededCategoryId,
          costCenterId: seededCostCenterId,
          expectedAmount: 1000,
          issueDate: new Date('2026-01-01'),
          dueDate: new Date('2026-02-01'),
        },
        {
          type: 'RECEIVABLE',
          description: 'Cliente B',
          categoryId: seededRevenueCategoryId,
          costCenterId: seededCostCenterId,
          expectedAmount: 500,
          issueDate: new Date('2026-01-05'),
          dueDate: new Date('2026-02-10'),
        },
      ],
    });

    expect(result.created).toBe(2);
    expect(result.entries).toHaveLength(2);
    expect(result.entries[0].type).toBe('PAYABLE');
    expect(result.entries[1].type).toBe('RECEIVABLE');
    expect(entriesRepository.items).toHaveLength(2);
  });

  it('should throw BadRequestError when no entries provided', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        entries: [],
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw BadRequestError when more than 20 entries', async () => {
    const entries = Array.from({ length: 21 }, (_, i) => ({
      type: 'PAYABLE' as const,
      description: `Entry ${i + 1}`,
      categoryId: seededCategoryId,
      costCenterId: seededCostCenterId,
      expectedAmount: 100,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
    }));

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        entries,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should wrap individual entry errors with index information', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        entries: [
          {
            type: 'PAYABLE',
            description: 'Válida',
            categoryId: seededCategoryId,
            costCenterId: seededCostCenterId,
            expectedAmount: 100,
            issueDate: new Date('2026-01-01'),
            dueDate: new Date('2026-02-01'),
          },
          {
            type: 'PAYABLE',
            description: '', // invalid: empty description
            categoryId: seededCategoryId,
            costCenterId: seededCostCenterId,
            expectedAmount: 100,
            issueDate: new Date('2026-01-01'),
            dueDate: new Date('2026-02-01'),
          },
        ],
      }),
    ).rejects.toThrow(/Entry 2/);
  });

  it('should create exactly 20 entries at the limit', async () => {
    const entries = Array.from({ length: 20 }, (_, i) => ({
      type: 'PAYABLE' as const,
      description: `Entrada ${i + 1}`,
      categoryId: seededCategoryId,
      costCenterId: seededCostCenterId,
      expectedAmount: 50,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
    }));

    const result = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      entries,
    });

    expect(result.created).toBe(20);
    expect(result.entries).toHaveLength(20);
  });
});
