import { InMemoryCompaniesRepository } from '@/repositories/core/in-memory/in-memory-companies-repository';
import { InMemoryFinanceCategoriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-categories-repository';
import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ExportSpedEcdUseCase } from './export-sped-ecd';

let entriesRepository: InMemoryFinanceEntriesRepository;
let categoriesRepository: InMemoryFinanceCategoriesRepository;
let companiesRepository: InMemoryCompaniesRepository;
let sut: ExportSpedEcdUseCase;

describe('ExportSpedEcdUseCase', () => {
  beforeEach(async () => {
    entriesRepository = new InMemoryFinanceEntriesRepository();
    categoriesRepository = new InMemoryFinanceCategoriesRepository();
    companiesRepository = new InMemoryCompaniesRepository();
    sut = new ExportSpedEcdUseCase(
      entriesRepository,
      categoriesRepository,
      companiesRepository,
    );

    // Create categories
    await categoriesRepository.create({
      tenantId: 'tenant-1',
      name: 'Servicos Prestados',
      slug: 'servicos-prestados',
      type: 'REVENUE',
    });

    await categoriesRepository.create({
      tenantId: 'tenant-1',
      name: 'Despesas Operacionais',
      slug: 'despesas-operacionais',
      type: 'EXPENSE',
    });

    // Create a company
    await companiesRepository.create({
      tenantId: 'tenant-1',
      legalName: 'Empresa Teste Ltda',
      cnpj: '12345678000190',
      tradeName: 'Empresa Teste',
    });

    const categories = await categoriesRepository.findMany('tenant-1');
    const revenueCategory = categories.find((c) => c.type === 'REVENUE')!;
    const expenseCategory = categories.find((c) => c.type === 'EXPENSE')!;

    // Create entries for March 2026
    await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'RECEIVABLE',
      code: 'REC-001',
      description: 'Servico prestado',
      categoryId: revenueCategory.id.toString(),
      expectedAmount: 10000,
      issueDate: new Date('2026-03-01'),
      dueDate: new Date('2026-03-15'),
      status: 'RECEIVED',
    });

    await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Aluguel escritorio',
      categoryId: expenseCategory.id.toString(),
      expectedAmount: 3000,
      issueDate: new Date('2026-03-01'),
      dueDate: new Date('2026-03-05'),
      status: 'PAID',
    });
  });

  it('should generate a valid SPED ECD file structure', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      year: 2026,
    });

    expect(result.fileName).toBe('SPED_ECD_2026.txt');
    expect(result.recordCount).toBeGreaterThan(0);

    const linesList = result.content.split('\r\n').filter(Boolean);

    // Must start with |0000| and end with |9999|
    expect(linesList[0]).toMatch(/^\|0000\|/);
    expect(linesList[linesList.length - 1]).toMatch(/^\|9999\|/);
  });

  it('should include LECD identifier in opening record', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      year: 2026,
    });

    expect(result.content).toContain('|0000|LECD|');
  });

  it('should include Block 0 opening records', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      year: 2026,
    });

    expect(result.content).toContain('|0000|');
    expect(result.content).toContain('|0001|');
    expect(result.content).toContain('|0007|');
    expect(result.content).toContain('|0990|');
  });

  it('should include Block I with chart of accounts (I050)', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      year: 2026,
    });

    expect(result.content).toContain('|I001|');
    expect(result.content).toContain('|I010|G|');
    expect(result.content).toContain('|I050|');
    expect(result.content).toContain('Servicos Prestados');
    expect(result.content).toContain('Despesas Operacionais');
  });

  it('should include trial balance records (I150/I155)', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      year: 2026,
    });

    expect(result.content).toContain('|I150|');
    expect(result.content).toContain('|I155|');
  });

  it('should include journal entries (I200/I250)', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      year: 2026,
    });

    expect(result.content).toContain('|I200|');
    expect(result.content).toContain('|I250|');
    expect(result.content).toContain('10000,00');
    expect(result.content).toContain('3000,00');
  });

  it('should include Block 9 closing records', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      year: 2026,
    });

    expect(result.content).toContain('|9001|');
    expect(result.content).toContain('|9900|');
    expect(result.content).toContain('|9990|');
    expect(result.content).toContain('|9999|');
  });

  it('should handle year with no entries', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      year: 2025,
    });

    expect(result.fileName).toBe('SPED_ECD_2025.txt');
    expect(result.content).toContain('|0000|');
    expect(result.content).toContain('|9999|');
  });

  it('should use company info when companyId is provided', async () => {
    const companies = await companiesRepository.findManyActive('tenant-1');
    const companyId = companies[0].id.toString();

    const result = await sut.execute({
      tenantId: 'tenant-1',
      year: 2026,
      companyId,
    });

    expect(result.content).toContain('Empresa Teste Ltda');
    expect(result.content).toContain('12345678000190');
  });

  it('should have correct record count in 9999 block', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      year: 2026,
    });

    const linesList = result.content.split('\r\n').filter(Boolean);
    expect(result.recordCount).toBe(linesList.length);
  });
});
