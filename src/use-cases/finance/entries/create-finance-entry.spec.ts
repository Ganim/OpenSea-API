import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { InMemoryFinanceCategoriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-categories-repository';
import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import { InMemoryCostCentersRepository } from '@/repositories/finance/in-memory/in-memory-cost-centers-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateFinanceEntryUseCase } from './create-finance-entry';

let entriesRepository: InMemoryFinanceEntriesRepository;
let categoriesRepository: InMemoryFinanceCategoriesRepository;
let costCentersRepository: InMemoryCostCentersRepository;
let sut: CreateFinanceEntryUseCase;

let seededCategoryId: string;
let seededCostCenterId: string;

describe('CreateFinanceEntryUseCase', () => {
  beforeEach(async () => {
    entriesRepository = new InMemoryFinanceEntriesRepository();
    categoriesRepository = new InMemoryFinanceCategoriesRepository();
    costCentersRepository = new InMemoryCostCentersRepository();
    sut = new CreateFinanceEntryUseCase(
      entriesRepository,
      categoriesRepository,
      costCentersRepository,
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
    const result = await sut.execute({
      tenantId: 'tenant-1',
      type: 'RECEIVABLE',
      description: 'Venda de mercadoria',
      categoryId: seededCategoryId,
      costCenterId: seededCostCenterId,
      expectedAmount: 12000,
      issueDate: new Date('2026-02-01'),
      dueDate: new Date('2026-03-01'),
    });

    expect(result.entry.type).toBe('RECEIVABLE');
    expect(result.entry.status).toBe('PENDING');
  });

  it('should auto-generate code (PAG-001, REC-001)', async () => {
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
      categoryId: seededCategoryId,
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
        type: 'INVALID',
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
});
