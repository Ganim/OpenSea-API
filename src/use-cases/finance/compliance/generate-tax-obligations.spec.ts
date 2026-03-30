import { InMemoryFinanceCategoriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-categories-repository';
import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import { InMemoryFinanceEntryRetentionsRepository } from '@/repositories/finance/in-memory/in-memory-finance-entry-retentions-repository';
import { InMemoryTaxObligationsRepository } from '@/repositories/finance/in-memory/in-memory-tax-obligations-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GenerateTaxObligationsUseCase } from './generate-tax-obligations';

let taxObligationsRepository: InMemoryTaxObligationsRepository;
let retentionsRepository: InMemoryFinanceEntryRetentionsRepository;
let entriesRepository: InMemoryFinanceEntriesRepository;
let categoriesRepository: InMemoryFinanceCategoriesRepository;
let sut: GenerateTaxObligationsUseCase;

describe('GenerateTaxObligationsUseCase', () => {
  beforeEach(async () => {
    taxObligationsRepository = new InMemoryTaxObligationsRepository();
    retentionsRepository = new InMemoryFinanceEntryRetentionsRepository();
    entriesRepository = new InMemoryFinanceEntriesRepository();
    categoriesRepository = new InMemoryFinanceCategoriesRepository();
    sut = new GenerateTaxObligationsUseCase(
      taxObligationsRepository,
      retentionsRepository,
      entriesRepository,
    );

    // Create category
    const category = await categoriesRepository.create({
      tenantId: 'tenant-1',
      name: 'Servicos',
      slug: 'servicos',
      type: 'REVENUE',
    });

    // Create an entry with retentions
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'RECEIVABLE',
      code: 'REC-001',
      description: 'Servico prestado',
      categoryId: category.id.toString(),
      expectedAmount: 10000,
      issueDate: new Date('2026-03-01'),
      dueDate: new Date('2026-03-15'),
      status: 'RECEIVED',
    });

    await retentionsRepository.createMany([
      {
        tenantId: 'tenant-1',
        entryId: entry.id.toString(),
        taxType: 'PIS',
        grossAmount: 10000,
        rate: 0.0065,
        amount: 65,
      },
      {
        tenantId: 'tenant-1',
        entryId: entry.id.toString(),
        taxType: 'COFINS',
        grossAmount: 10000,
        rate: 0.03,
        amount: 300,
      },
      {
        tenantId: 'tenant-1',
        entryId: entry.id.toString(),
        taxType: 'IRRF',
        grossAmount: 10000,
        rate: 0.015,
        amount: 150,
      },
    ]);
  });

  it('should generate tax obligations from retentions', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      year: 2026,
      month: 3,
    });

    expect(result.created).toHaveLength(3);
    expect(result.skipped).toBe(0);

    const taxTypes = result.created.map((o) => o.taxType).sort();
    expect(taxTypes).toEqual(['COFINS', 'IRRF', 'PIS']);
  });

  it('should set correct amounts from retentions', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      year: 2026,
      month: 3,
    });

    const pisObligation = result.created.find((o) => o.taxType === 'PIS');
    const cofinsObligation = result.created.find((o) => o.taxType === 'COFINS');
    const irrfObligation = result.created.find((o) => o.taxType === 'IRRF');

    expect(pisObligation?.amount).toBe(65);
    expect(cofinsObligation?.amount).toBe(300);
    expect(irrfObligation?.amount).toBe(150);
  });

  it('should set correct DARF codes', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      year: 2026,
      month: 3,
    });

    const pisObligation = result.created.find((o) => o.taxType === 'PIS');
    const cofinsObligation = result.created.find((o) => o.taxType === 'COFINS');
    const irrfObligation = result.created.find((o) => o.taxType === 'IRRF');

    expect(pisObligation?.darfCode).toBe('8109');
    expect(cofinsObligation?.darfCode).toBe('2172');
    expect(irrfObligation?.darfCode).toBe('0561');
  });

  it('should set due dates in the following month', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      year: 2026,
      month: 3,
    });

    for (const obligation of result.created) {
      // Due date should be in April 2026 (month following March)
      expect(obligation.dueDate.getFullYear()).toBe(2026);
      expect(obligation.dueDate.getMonth()).toBe(3); // April (0-indexed)
    }
  });

  it('should skip already existing obligations', async () => {
    // Generate first time
    await sut.execute({
      tenantId: 'tenant-1',
      year: 2026,
      month: 3,
    });

    // Generate again - should skip all
    const secondResult = await sut.execute({
      tenantId: 'tenant-1',
      year: 2026,
      month: 3,
    });

    expect(secondResult.created).toHaveLength(0);
    expect(secondResult.skipped).toBe(3);
  });

  it('should handle period with no retentions', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      year: 2026,
      month: 6,
    });

    expect(result.created).toHaveLength(0);
    expect(result.skipped).toBe(0);
  });

  it('should set reference month and year correctly', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      year: 2026,
      month: 3,
    });

    for (const obligation of result.created) {
      expect(obligation.referenceMonth).toBe(3);
      expect(obligation.referenceYear).toBe(2026);
    }
  });

  it('should create obligations with PENDING status', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      year: 2026,
      month: 3,
    });

    for (const obligation of result.created) {
      expect(obligation.status).toBe('PENDING');
    }
  });
});
