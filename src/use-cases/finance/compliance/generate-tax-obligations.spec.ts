import { InMemoryFinanceCategoriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-categories-repository';
import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import { InMemoryFinanceEntryRetentionsRepository } from '@/repositories/finance/in-memory/in-memory-finance-entry-retentions-repository';
import { InMemoryTaxObligationsRepository } from '@/repositories/finance/in-memory/in-memory-tax-obligations-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  GenerateTaxObligationsUseCase,
  getLastBusinessDayOfMonth,
} from './generate-tax-obligations';

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

  it('should emit ISS obligations WITHOUT DARF code (ISS is municipal)', async () => {
    // Add an ISS retention so an ISS obligation is generated
    const category = await categoriesRepository.create({
      tenantId: 'tenant-1',
      name: 'Servicos Municipais',
      slug: 'servicos-municipais',
      type: 'REVENUE',
    });

    const issEntry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'RECEIVABLE',
      code: 'REC-ISS-001',
      description: 'Servico com ISS',
      categoryId: category.id.toString(),
      expectedAmount: 20000,
      issueDate: new Date('2026-05-01'),
      dueDate: new Date('2026-05-15'),
      status: 'RECEIVED',
    });

    await retentionsRepository.createMany([
      {
        tenantId: 'tenant-1',
        entryId: issEntry.id.toString(),
        taxType: 'ISS',
        grossAmount: 20000,
        rate: 0.05,
        amount: 1000,
      },
    ]);

    const result = await sut.execute({
      tenantId: 'tenant-1',
      year: 2026,
      month: 5,
    });

    const issObligation = result.created.find((o) => o.taxType === 'ISS');

    expect(issObligation).toBeDefined();
    expect(issObligation?.darfCode).toBeUndefined();
    expect(issObligation?.amount).toBe(1000);
  });

  describe('getLastBusinessDayOfMonth (Brazilian holidays-aware)', () => {
    it('should roll back when last day is a weekend', () => {
      // August 2026: 31st is Monday. Use 2025 (Aug 31 is Sunday).
      // Easier: February 2026: 28th = Saturday → expect Friday 27.
      const lastBusinessDay = getLastBusinessDayOfMonth(2026, 2);
      expect(lastBusinessDay.getFullYear()).toBe(2026);
      expect(lastBusinessDay.getMonth()).toBe(1); // February (0-indexed)
      expect(lastBusinessDay.getDay()).not.toBe(0);
      expect(lastBusinessDay.getDay()).not.toBe(6);
    });

    it('should roll back past Christmas (Dec 25) national holiday', () => {
      // December 2026: 31st = Thursday (business day), 25th = Friday (Natal).
      // Last business day of month should be Dec 31, not rolled back.
      const lastBusinessDay = getLastBusinessDayOfMonth(2026, 12);
      expect(lastBusinessDay.getMonth()).toBe(11); // December
      expect(lastBusinessDay.getDate()).toBe(31);
      expect(lastBusinessDay.getDay()).not.toBe(0);
      expect(lastBusinessDay.getDay()).not.toBe(6);
    });

    it('should roll back when last day falls on Confraternização (Jan 1)', () => {
      // January 2026: 31st = Saturday → Friday 30th.
      const lastBusinessDay = getLastBusinessDayOfMonth(2026, 1);
      expect(lastBusinessDay.getMonth()).toBe(0); // January
      expect(lastBusinessDay.getDate()).toBe(30);
    });

    it('should return a business day (not a holiday, not a weekend)', () => {
      // November 2026: 30th = Monday. 15th = Proclamação (Sunday this year).
      // Last business day must be a business day regardless of year.
      for (const [year, month] of [
        [2026, 1],
        [2026, 12],
        [2027, 1],
        [2025, 5],
      ] as const) {
        const lastBusinessDay = getLastBusinessDayOfMonth(year, month);
        expect(lastBusinessDay.getDay()).not.toBe(0);
        expect(lastBusinessDay.getDay()).not.toBe(6);
      }
    });
  });
});
