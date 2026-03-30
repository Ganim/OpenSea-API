import { InMemoryCompaniesRepository } from '@/repositories/core/in-memory/in-memory-companies-repository';
import { InMemoryFinanceCategoriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-categories-repository';
import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetConsolidatedDREUseCase } from './get-dre-consolidated';

let categoriesRepository: InMemoryFinanceCategoriesRepository;
let entriesRepository: InMemoryFinanceEntriesRepository;
let companiesRepository: InMemoryCompaniesRepository;
let sut: GetConsolidatedDREUseCase;

describe('GetConsolidatedDREUseCase', () => {
  let companyAId: string;
  let companyBId: string;

  beforeEach(async () => {
    categoriesRepository = new InMemoryFinanceCategoriesRepository();
    entriesRepository = new InMemoryFinanceEntriesRepository();
    companiesRepository = new InMemoryCompaniesRepository();
    sut = new GetConsolidatedDREUseCase(
      categoriesRepository,
      entriesRepository,
      companiesRepository,
    );

    // Create two companies
    const companyA = await companiesRepository.create({
      tenantId: 'tenant-1',
      legalName: 'Empresa Alpha Ltda',
      cnpj: '11111111000100',
      tradeName: 'Alpha',
    });
    companyAId = companyA.id.toString();

    const companyB = await companiesRepository.create({
      tenantId: 'tenant-1',
      legalName: 'Empresa Beta Ltda',
      cnpj: '22222222000100',
      tradeName: 'Beta',
    });
    companyBId = companyB.id.toString();

    // Create categories
    const revenueRoot = await categoriesRepository.create({
      tenantId: 'tenant-1',
      name: 'Receitas',
      slug: 'receitas',
      type: 'REVENUE',
    });

    const revenueChild = await categoriesRepository.create({
      tenantId: 'tenant-1',
      name: 'Vendas',
      slug: 'vendas',
      type: 'REVENUE',
      parentId: revenueRoot.id.toString(),
    });

    const expenseRoot = await categoriesRepository.create({
      tenantId: 'tenant-1',
      name: 'Despesas',
      slug: 'despesas',
      type: 'EXPENSE',
    });

    const expenseChild = await categoriesRepository.create({
      tenantId: 'tenant-1',
      name: 'Aluguel',
      slug: 'aluguel',
      type: 'EXPENSE',
      parentId: expenseRoot.id.toString(),
    });

    // Company A entries (competenceDate set for accrual accounting)
    await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'RECEIVABLE',
      code: 'REC-001',
      description: 'Venda Alpha 1',
      categoryId: revenueChild.id.toString(),
      companyId: companyAId,
      expectedAmount: 10000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-01-15'),
      competenceDate: new Date('2026-01-01'),
      status: 'RECEIVED',
    });

    await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Aluguel Alpha',
      categoryId: expenseChild.id.toString(),
      companyId: companyAId,
      expectedAmount: 3000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-01-10'),
      competenceDate: new Date('2026-01-01'),
      status: 'PAID',
    });

    // Company B entries (competenceDate set for accrual accounting)
    await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'RECEIVABLE',
      code: 'REC-002',
      description: 'Venda Beta 1',
      categoryId: revenueChild.id.toString(),
      companyId: companyBId,
      expectedAmount: 5000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-01-20'),
      competenceDate: new Date('2026-01-01'),
      status: 'RECEIVED',
    });

    await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-002',
      description: 'Aluguel Beta',
      categoryId: expenseChild.id.toString(),
      companyId: companyBId,
      expectedAmount: 2000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-01-10'),
      competenceDate: new Date('2026-01-01'),
      status: 'PAID',
    });
  });

  it('should return DRE per company and consolidated totals', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-01-31'),
    });

    expect(result.companies).toHaveLength(2);
    expect(result.consolidated.revenue).toBe(15000);
    expect(result.consolidated.expenses).toBe(5000);
    expect(result.consolidated.netResult).toBe(10000);
  });

  it('should separate revenue and expenses per company', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-01-31'),
    });

    const alpha = result.companies.find((c) => c.companyId === companyAId);
    const beta = result.companies.find((c) => c.companyId === companyBId);

    expect(alpha).toBeDefined();
    expect(alpha!.revenue).toBe(10000);
    expect(alpha!.expenses).toBe(3000);
    expect(alpha!.netResult).toBe(7000);

    expect(beta).toBeDefined();
    expect(beta!.revenue).toBe(5000);
    expect(beta!.expenses).toBe(2000);
    expect(beta!.netResult).toBe(3000);
  });

  it('should filter by specific company IDs', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-01-31'),
      companyIds: [companyAId],
    });

    expect(result.companies).toHaveLength(1);
    expect(result.companies[0].companyId).toBe(companyAId);
    expect(result.companies[0].revenue).toBe(10000);
    expect(result.consolidated.revenue).toBe(10000);
  });

  it('should include company name from tradeName', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-01-31'),
    });

    const alpha = result.companies.find((c) => c.companyId === companyAId);
    expect(alpha!.companyName).toBe('Alpha');
  });

  it('should include period dates in response', async () => {
    const start = new Date('2026-01-01');
    const end = new Date('2026-01-31');

    const result = await sut.execute({
      tenantId: 'tenant-1',
      startDate: start,
      endDate: end,
    });

    expect(result.period.start).toEqual(start);
    expect(result.period.end).toEqual(end);
  });

  it('should return empty companies for tenant with no companies', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-2',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-01-31'),
    });

    expect(result.companies).toHaveLength(0);
    expect(result.consolidated.revenue).toBe(0);
    expect(result.consolidated.expenses).toBe(0);
    expect(result.consolidated.netResult).toBe(0);
  });

  it('should only include PAID/RECEIVED entries', async () => {
    // Add a PENDING entry - should not be counted
    const categories = await categoriesRepository.findMany('tenant-1');
    const revenueCategory = categories.find((c) => c.name === 'Vendas');

    await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'RECEIVABLE',
      code: 'REC-003',
      description: 'Venda Pendente',
      categoryId: revenueCategory!.id.toString(),
      companyId: companyAId,
      expectedAmount: 99999,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-01-25'),
      status: 'PENDING',
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-01-31'),
    });

    const alpha = result.companies.find((c) => c.companyId === companyAId);
    expect(alpha!.revenue).toBe(10000); // Pending not included
  });

  it('should include hierarchical category trees per company', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-01-31'),
    });

    const alpha = result.companies.find((c) => c.companyId === companyAId);
    expect(alpha!.revenueTree.children.length).toBeGreaterThan(0);
    expect(alpha!.expenseTree.children.length).toBeGreaterThan(0);
  });
});
