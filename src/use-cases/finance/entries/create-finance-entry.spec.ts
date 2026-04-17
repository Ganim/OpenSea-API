import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import type { FinanceEntryType } from '@/entities/finance/finance-entry-types';
import { InMemoryFinanceCategoriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-categories-repository';
import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import { InMemoryCostCentersRepository } from '@/repositories/finance/in-memory/in-memory-cost-centers-repository';
import { InMemoryFinanceEntryCostCentersRepository } from '@/repositories/finance/in-memory/in-memory-finance-entry-cost-centers-repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock logger to avoid loading @/@env validation during unit tests
vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { CreateFinanceEntryUseCase } from './create-finance-entry';

let entriesRepository: InMemoryFinanceEntriesRepository;
let categoriesRepository: InMemoryFinanceCategoriesRepository;
let costCentersRepository: InMemoryCostCentersRepository;
let costCenterAllocationsRepository: InMemoryFinanceEntryCostCentersRepository;
let sut: CreateFinanceEntryUseCase;

let seededCategoryId: string;
let seededCostCenterId: string;
let seededCostCenterId2: string;
let seededCostCenterId3: string;

describe('CreateFinanceEntryUseCase', () => {
  beforeEach(async () => {
    entriesRepository = new InMemoryFinanceEntriesRepository();
    categoriesRepository = new InMemoryFinanceCategoriesRepository();
    costCentersRepository = new InMemoryCostCentersRepository();
    costCenterAllocationsRepository =
      new InMemoryFinanceEntryCostCentersRepository();
    sut = new CreateFinanceEntryUseCase(
      entriesRepository,
      categoriesRepository,
      costCentersRepository,
      undefined, // calendarSyncService
      undefined, // transactionManager
      costCenterAllocationsRepository,
    );

    const category = await categoriesRepository.create({
      tenantId: 'tenant-1',
      name: 'Fornecedores',
      slug: 'fornecedores',
      type: 'EXPENSE',
      isActive: true,
    });
    seededCategoryId = category.id.toString();

    const costCenter = await costCentersRepository.create({
      tenantId: 'tenant-1',
      code: 'CC-001',
      name: 'Administrativo',
    });
    seededCostCenterId = costCenter.id.toString();

    const costCenter2 = await costCentersRepository.create({
      tenantId: 'tenant-1',
      code: 'CC-002',
      name: 'Comercial',
    });
    seededCostCenterId2 = costCenter2.id.toString();

    const costCenter3 = await costCentersRepository.create({
      tenantId: 'tenant-1',
      code: 'CC-003',
      name: 'Operacional',
    });
    seededCostCenterId3 = costCenter3.id.toString();
  });

  it('should create a finance entry (PAYABLE)', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      description: 'Aluguel do escritorio',
      categoryId: seededCategoryId,
      costCenterId: seededCostCenterId,
      expectedAmount: 5000,
      issueDate: new Date('2026-02-01'),
      dueDate: new Date('2026-02-28'),
    });

    expect(result.entry).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        type: 'PAYABLE',
        description: 'Aluguel do escritorio',
        expectedAmount: 5000,
        status: 'PENDING',
      }),
    );
  });

  it('should create a receivable entry', async () => {
    const revenueCategory = await categoriesRepository.create({
      tenantId: 'tenant-1',
      name: 'Vendas',
      slug: 'vendas',
      type: 'REVENUE',
      isActive: true,
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      type: 'RECEIVABLE',
      description: 'Venda de mercadoria',
      categoryId: revenueCategory.id.toString(),
      costCenterId: seededCostCenterId,
      expectedAmount: 12000,
      issueDate: new Date('2026-02-01'),
      dueDate: new Date('2026-03-01'),
    });

    expect(result.entry.type).toBe('RECEIVABLE');
    expect(result.entry.status).toBe('PENDING');
  });

  it('should auto-generate code (PAG-001, REC-001)', async () => {
    const revenueCategory = await categoriesRepository.create({
      tenantId: 'tenant-1',
      name: 'Receitas',
      slug: 'receitas',
      type: 'REVENUE',
      isActive: true,
    });

    const payableResult = await sut.execute({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      description: 'Conta de luz',
      categoryId: seededCategoryId,
      costCenterId: seededCostCenterId,
      expectedAmount: 350,
      issueDate: new Date('2026-02-01'),
      dueDate: new Date('2026-02-15'),
    });

    expect(payableResult.entry.code).toBe('PAG-001');

    const receivableResult = await sut.execute({
      tenantId: 'tenant-1',
      type: 'RECEIVABLE',
      description: 'Servico prestado',
      categoryId: revenueCategory.id.toString(),
      costCenterId: seededCostCenterId,
      expectedAmount: 8000,
      issueDate: new Date('2026-02-01'),
      dueDate: new Date('2026-03-01'),
    });

    expect(receivableResult.entry.code).toBe('REC-001');
  });

  it('should not create with empty description', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        type: 'PAYABLE',
        description: '',
        categoryId: seededCategoryId,
        costCenterId: seededCostCenterId,
        expectedAmount: 1000,
        issueDate: new Date('2026-02-01'),
        dueDate: new Date('2026-02-28'),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not create with invalid type', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        type: 'INVALID' as FinanceEntryType,
        description: 'Teste invalido',
        categoryId: seededCategoryId,
        costCenterId: seededCostCenterId,
        expectedAmount: 1000,
        issueDate: new Date('2026-02-01'),
        dueDate: new Date('2026-02-28'),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not create with negative amount', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        type: 'PAYABLE',
        description: 'Valor negativo',
        categoryId: seededCategoryId,
        costCenterId: seededCostCenterId,
        expectedAmount: -500,
        issueDate: new Date('2026-02-01'),
        dueDate: new Date('2026-02-28'),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not create with non-existent category', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        type: 'PAYABLE',
        description: 'Categoria inexistente',
        categoryId: 'non-existent-category-id',
        costCenterId: seededCostCenterId,
        expectedAmount: 1000,
        issueDate: new Date('2026-02-01'),
        dueDate: new Date('2026-02-28'),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not create with non-existent cost center', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        type: 'PAYABLE',
        description: 'Centro de custo inexistente',
        categoryId: seededCategoryId,
        costCenterId: 'non-existent-cost-center-id',
        expectedAmount: 1000,
        issueDate: new Date('2026-02-01'),
        dueDate: new Date('2026-02-28'),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  // --- INSTALLMENT TESTS ---

  it('should create master + 3 installment entries', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      description: 'Financiamento',
      categoryId: seededCategoryId,
      costCenterId: seededCostCenterId,
      expectedAmount: 3000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
      recurrenceType: 'INSTALLMENT',
      recurrenceInterval: 1,
      recurrenceUnit: 'MONTHLY',
      totalInstallments: 3,
    });

    // Master entry
    expect(result.entry.recurrenceType).toBe('INSTALLMENT');
    expect(result.entry.expectedAmount).toBe(3000);

    // 3 child installments
    expect(result.installments).toHaveLength(3);
    expect(result.installments![0].expectedAmount).toBe(1000);
    expect(result.installments![0].currentInstallment).toBe(1);
    expect(result.installments![0].description).toBe('Financiamento (1/3)');
    expect(result.installments![0].parentEntryId).toBe(result.entry.id);

    expect(result.installments![2].currentInstallment).toBe(3);
    expect(result.installments![2].description).toBe('Financiamento (3/3)');

    // Total: 1 master + 3 installments = 4 in the repo
    expect(entriesRepository.items).toHaveLength(4);
  });

  it('should calculate installment due dates correctly', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      description: 'Parcela',
      categoryId: seededCategoryId,
      costCenterId: seededCostCenterId,
      expectedAmount: 6000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-15'),
      recurrenceType: 'INSTALLMENT',
      recurrenceInterval: 1,
      recurrenceUnit: 'MONTHLY',
      totalInstallments: 3,
    });

    expect(result.installments![0].dueDate).toEqual(new Date('2026-02-15'));
    expect(result.installments![1].dueDate).toEqual(new Date('2026-03-15'));
    expect(result.installments![2].dueDate).toEqual(new Date('2026-04-15'));
  });

  it('should reject installment with less than 2 installments', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        type: 'PAYABLE',
        description: 'Parcela invalida',
        categoryId: seededCategoryId,
        costCenterId: seededCostCenterId,
        expectedAmount: 1000,
        issueDate: new Date('2026-01-01'),
        dueDate: new Date('2026-02-01'),
        recurrenceType: 'INSTALLMENT',
        recurrenceInterval: 1,
        recurrenceUnit: 'MONTHLY',
        totalInstallments: 1,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should reject installment without recurrence interval', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        type: 'PAYABLE',
        description: 'Parcela invalida',
        categoryId: seededCategoryId,
        costCenterId: seededCostCenterId,
        expectedAmount: 1000,
        issueDate: new Date('2026-01-01'),
        dueDate: new Date('2026-02-01'),
        recurrenceType: 'INSTALLMENT',
        totalInstallments: 3,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  // --- RECURRING TESTS ---

  it('should create master + first occurrence for recurring entry', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      description: 'Aluguel mensal',
      categoryId: seededCategoryId,
      costCenterId: seededCostCenterId,
      expectedAmount: 5000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
      recurrenceType: 'RECURRING',
      recurrenceInterval: 1,
      recurrenceUnit: 'MONTHLY',
    });

    // Master entry
    expect(result.entry.recurrenceType).toBe('RECURRING');
    expect(result.entry.expectedAmount).toBe(5000);

    // First occurrence
    expect(result.installments).toHaveLength(1);
    expect(result.installments![0].description).toBe('Aluguel mensal (1)');
    expect(result.installments![0].parentEntryId).toBe(result.entry.id);
    expect(result.installments![0].currentInstallment).toBe(1);
    expect(result.installments![0].expectedAmount).toBe(5000);

    // Total: 1 master + 1 occurrence = 2 in the repo
    expect(entriesRepository.items).toHaveLength(2);
  });

  it('should reject recurring without recurrence interval', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        type: 'PAYABLE',
        description: 'Aluguel',
        categoryId: seededCategoryId,
        costCenterId: seededCostCenterId,
        expectedAmount: 5000,
        issueDate: new Date('2026-01-01'),
        dueDate: new Date('2026-02-01'),
        recurrenceType: 'RECURRING',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  // --- RATEIO (COST CENTER ALLOCATION) TESTS ---

  it('should create entry with costCenterAllocations (3 centers, 33.33/33.33/33.34 split)', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      description: 'Rateio teste',
      categoryId: seededCategoryId,
      costCenterAllocations: [
        { costCenterId: seededCostCenterId, percentage: 33.33 },
        { costCenterId: seededCostCenterId2, percentage: 33.33 },
        { costCenterId: seededCostCenterId3, percentage: 33.34 },
      ],
      expectedAmount: 3000,
      issueDate: new Date('2026-02-01'),
      dueDate: new Date('2026-02-28'),
    });

    // Entry should have null costCenterId
    expect(result.entry.costCenterId).toBeUndefined();

    // Junction records should be created
    const allocations = await costCenterAllocationsRepository.findByEntryId(
      result.entry.id,
    );
    expect(allocations).toHaveLength(3);

    // Verify amounts
    const amounts = allocations.map((a) => a.amount);
    const totalAllocated = amounts.reduce((sum, a) => sum + a, 0);
    expect(totalAllocated).toBe(3000);

    // First two should be 999.90 (33.33% of 3000), third gets remainder
    expect(allocations[0].percentage).toBe(33.33);
    expect(allocations[1].percentage).toBe(33.33);
    expect(allocations[2].percentage).toBe(33.34);
  });

  it('should create with single costCenterId (no junction records)', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      description: 'Sem rateio',
      categoryId: seededCategoryId,
      costCenterId: seededCostCenterId,
      expectedAmount: 1000,
      issueDate: new Date('2026-02-01'),
      dueDate: new Date('2026-02-28'),
    });

    expect(result.entry.costCenterId).toBe(seededCostCenterId);

    // No junction records should be created
    const allocations = await costCenterAllocationsRepository.findByEntryId(
      result.entry.id,
    );
    expect(allocations).toHaveLength(0);
  });

  it('should throw when providing both costCenterId and costCenterAllocations', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        type: 'PAYABLE',
        description: 'Conflito',
        categoryId: seededCategoryId,
        costCenterId: seededCostCenterId,
        costCenterAllocations: [
          { costCenterId: seededCostCenterId2, percentage: 50 },
          { costCenterId: seededCostCenterId3, percentage: 50 },
        ],
        expectedAmount: 1000,
        issueDate: new Date('2026-02-01'),
        dueDate: new Date('2026-02-28'),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw when allocations do not sum to 100', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        type: 'PAYABLE',
        description: 'Rateio invalido',
        categoryId: seededCategoryId,
        costCenterAllocations: [
          { costCenterId: seededCostCenterId, percentage: 30 },
          { costCenterId: seededCostCenterId2, percentage: 30 },
        ],
        expectedAmount: 1000,
        issueDate: new Date('2026-02-01'),
        dueDate: new Date('2026-02-28'),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw when neither costCenterId nor costCenterAllocations provided', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        type: 'PAYABLE',
        description: 'Nenhum centro de custo',
        categoryId: seededCategoryId,
        expectedAmount: 1000,
        issueDate: new Date('2026-02-01'),
        dueDate: new Date('2026-02-28'),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should create installments with rateio -- each installment inherits allocations', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      description: 'Financiamento rateado',
      categoryId: seededCategoryId,
      costCenterAllocations: [
        { costCenterId: seededCostCenterId, percentage: 50 },
        { costCenterId: seededCostCenterId2, percentage: 50 },
      ],
      expectedAmount: 6000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
      recurrenceType: 'INSTALLMENT',
      recurrenceInterval: 1,
      recurrenceUnit: 'MONTHLY',
      totalInstallments: 3,
    });

    // Master entry should have null costCenterId
    expect(result.entry.costCenterId).toBeUndefined();

    // Master entry allocations
    const masterAllocations =
      await costCenterAllocationsRepository.findByEntryId(result.entry.id);
    expect(masterAllocations).toHaveLength(2);
    expect(masterAllocations[0].amount).toBe(3000);
    expect(masterAllocations[1].amount).toBe(3000);

    // Each installment should have allocations
    expect(result.installments).toHaveLength(3);
    for (const installment of result.installments!) {
      expect(installment.costCenterId).toBeUndefined();
      const installmentAllocations =
        await costCenterAllocationsRepository.findByEntryId(installment.id);
      expect(installmentAllocations).toHaveLength(2);
      // Each installment is 2000, so 50% each = 1000
      expect(installmentAllocations[0].amount).toBe(1000);
      expect(installmentAllocations[1].amount).toBe(1000);
    }
  });
});
