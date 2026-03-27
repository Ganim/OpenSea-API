import { InMemoryCompaniesRepository } from '@/repositories/core/in-memory/in-memory-companies-repository';
import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import { InMemoryFinanceEntryRetentionsRepository } from '@/repositories/finance/in-memory/in-memory-finance-entry-retentions-repository';
import { InMemoryFinanceCategoriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-categories-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ExportSpedEfdUseCase } from './export-sped-efd';

let entriesRepository: InMemoryFinanceEntriesRepository;
let retentionsRepository: InMemoryFinanceEntryRetentionsRepository;
let companiesRepository: InMemoryCompaniesRepository;
let categoriesRepository: InMemoryFinanceCategoriesRepository;
let sut: ExportSpedEfdUseCase;

describe('ExportSpedEfdUseCase', () => {
  beforeEach(async () => {
    entriesRepository = new InMemoryFinanceEntriesRepository();
    retentionsRepository = new InMemoryFinanceEntryRetentionsRepository();
    companiesRepository = new InMemoryCompaniesRepository();
    categoriesRepository = new InMemoryFinanceCategoriesRepository();
    sut = new ExportSpedEfdUseCase(
      entriesRepository,
      retentionsRepository,
      companiesRepository,
    );

    // Create a category
    const category = await categoriesRepository.create({
      tenantId: 'tenant-1',
      name: 'Servicos',
      slug: 'servicos',
      type: 'REVENUE',
    });

    // Create a company
    await companiesRepository.create({
      tenantId: 'tenant-1',
      legalName: 'Empresa Teste Ltda',
      cnpj: '12345678000190',
      tradeName: 'Empresa Teste',
    });

    // Create an entry with PIS/COFINS retentions
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
    ]);
  });

  it('should generate a valid SPED EFD-Contribuicoes file structure', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      year: 2026,
      month: 3,
    });

    expect(result.fileName).toBe('SPED_EFD_2026_03.txt');
    expect(result.mimeType).toBe('text/plain; charset=utf-8');

    const linesList = result.content.split('\r\n').filter(Boolean);

    // Must start with |0000| and end with |9999|
    expect(linesList[0]).toMatch(/^\|0000\|/);
    expect(linesList[linesList.length - 1]).toMatch(/^\|9999\|/);
  });

  it('should include Block 0 opening records', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      year: 2026,
      month: 3,
    });

    expect(result.content).toContain('|0000|');
    expect(result.content).toContain('|0001|');
    expect(result.content).toContain('|0100|');
    expect(result.content).toContain('|0140|');
  });

  it('should include Block M with PIS apuration (M200, M210)', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      year: 2026,
      month: 3,
    });

    expect(result.content).toContain('|M001|');
    expect(result.content).toContain('|M200|');
    expect(result.content).toContain('|M210|');
  });

  it('should include Block M with COFINS apuration (M600, M610)', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      year: 2026,
      month: 3,
    });

    expect(result.content).toContain('|M600|');
    expect(result.content).toContain('|M610|');
  });

  it('should include Block 9 closing records', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      year: 2026,
      month: 3,
    });

    expect(result.content).toContain('|9001|');
    expect(result.content).toContain('|9900|');
    expect(result.content).toContain('|9999|');
  });

  it('should include PIS values in M210 record', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      year: 2026,
      month: 3,
    });

    // PIS base = 10000, value = 65
    expect(result.content).toContain('10000,00'); // base
    expect(result.content).toContain('65,00'); // PIS value
  });

  it('should include COFINS values in M610 record', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      year: 2026,
      month: 3,
    });

    // COFINS value = 300
    expect(result.content).toContain('300,00');
  });

  it('should handle period with no retentions', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      year: 2026,
      month: 6, // No entries in June
    });

    expect(result.fileName).toBe('SPED_EFD_2026_06.txt');
    // Should still produce valid file structure
    expect(result.content).toContain('|0000|');
    expect(result.content).toContain('|9999|');
  });

  it('should use company info when companyId is provided', async () => {
    const companies = await companiesRepository.findManyActive('tenant-1');
    const companyId = companies[0].id.toString();

    const result = await sut.execute({
      tenantId: 'tenant-1',
      year: 2026,
      month: 3,
      companyId,
    });

    expect(result.content).toContain('Empresa Teste Ltda');
    expect(result.content).toContain('12345678000190');
  });
});
