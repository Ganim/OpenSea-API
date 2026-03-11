import { InMemoryFinanceCategoriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-categories-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { SeedFinanceCategoriesUseCase } from './seed-finance-categories';

let repository: InMemoryFinanceCategoriesRepository;
let sut: SeedFinanceCategoriesUseCase;

describe('SeedFinanceCategoriesUseCase', () => {
  beforeEach(() => {
    repository = new InMemoryFinanceCategoriesRepository();
    sut = new SeedFinanceCategoriesUseCase(repository);
  });

  it('should create the full DRE category tree', async () => {
    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.skipped).toBe(false);
    expect(result.created).toBeGreaterThan(0);

    const categories = await repository.findMany('tenant-1');
    expect(categories.length).toBe(result.created);
  });

  it('should create RECEITA root categories', async () => {
    await sut.execute({ tenantId: 'tenant-1' });

    const categories = await repository.findMany('tenant-1');
    const rootRevenue = categories.filter(
      (c) => !c.parentId && c.type === 'REVENUE',
    );

    const names = rootRevenue.map((c) => c.name);
    expect(names).toContain('Receita Operacional Bruta');
    expect(names).toContain('Deducoes da Receita');
    expect(names).toContain('Receitas Financeiras');
  });

  it('should create DESPESA root categories', async () => {
    await sut.execute({ tenantId: 'tenant-1' });

    const categories = await repository.findMany('tenant-1');
    const rootExpense = categories.filter(
      (c) => !c.parentId && c.type === 'EXPENSE',
    );

    const names = rootExpense.map((c) => c.name);
    expect(names).toContain('Custos dos Produtos e Servicos');
    expect(names).toContain('Despesas Operacionais');
    expect(names).toContain('Despesas Financeiras');
    expect(names).toContain('Resultado Nao Operacional');
  });

  it('should create child categories under Receita Operacional Bruta', async () => {
    await sut.execute({ tenantId: 'tenant-1' });

    const categories = await repository.findMany('tenant-1');
    const receita = categories.find(
      (c) => c.name === 'Receita Operacional Bruta',
    );
    expect(receita).toBeDefined();

    const children = categories.filter(
      (c) => c.parentId?.toString() === receita!.id.toString(),
    );
    const names = children.map((c) => c.name);
    expect(names).toContain('Vendas de Produtos');
    expect(names).toContain('Prestacao de Servicos');
  });

  it('should create child categories under Deducoes da Receita', async () => {
    await sut.execute({ tenantId: 'tenant-1' });

    const categories = await repository.findMany('tenant-1');
    const deducoes = categories.find((c) => c.name === 'Deducoes da Receita');

    const children = categories.filter(
      (c) => c.parentId?.toString() === deducoes!.id.toString(),
    );
    const names = children.map((c) => c.name);
    expect(names).toContain('Impostos sobre Vendas');
    expect(names).toContain('Devolucoes e Abatimentos');
  });

  it('should create child categories under Despesas Operacionais', async () => {
    await sut.execute({ tenantId: 'tenant-1' });

    const categories = await repository.findMany('tenant-1');
    const despesas = categories.find((c) => c.name === 'Despesas Operacionais');

    const children = categories.filter(
      (c) => c.parentId?.toString() === despesas!.id.toString(),
    );
    const names = children.map((c) => c.name);
    expect(names).toContain('Pessoal');
    expect(names).toContain('Administrativas');
    expect(names).toContain('Comerciais');
  });

  it('should create child categories under CMV', async () => {
    await sut.execute({ tenantId: 'tenant-1' });

    const categories = await repository.findMany('tenant-1');
    const cmv = categories.find(
      (c) => c.name === 'Custos dos Produtos e Servicos',
    );

    const children = categories.filter(
      (c) => c.parentId?.toString() === cmv!.id.toString(),
    );
    const names = children.map((c) => c.name);
    expect(names).toContain('Custo de Mercadorias Vendidas');
    expect(names).toContain('Custo de Servicos Prestados');
  });

  it('should create child categories under Despesas Financeiras', async () => {
    await sut.execute({ tenantId: 'tenant-1' });

    const categories = await repository.findMany('tenant-1');
    const fin = categories.find((c) => c.name === 'Despesas Financeiras');

    const children = categories.filter(
      (c) => c.parentId?.toString() === fin!.id.toString(),
    );
    const names = children.map((c) => c.name);
    expect(names).toContain('Juros e Multas');
    expect(names).toContain('Tarifas Bancarias');
  });

  it('should create child categories under Receitas Financeiras', async () => {
    await sut.execute({ tenantId: 'tenant-1' });

    const categories = await repository.findMany('tenant-1');
    const recFin = categories.find((c) => c.name === 'Receitas Financeiras');

    const children = categories.filter(
      (c) => c.parentId?.toString() === recFin!.id.toString(),
    );
    expect(children).toHaveLength(1);
    expect(children[0].name).toBe('Rendimentos de Aplicacao');
  });

  it('should create child categories under Resultado Nao Operacional', async () => {
    await sut.execute({ tenantId: 'tenant-1' });

    const categories = await repository.findMany('tenant-1');
    const res = categories.find((c) => c.name === 'Resultado Nao Operacional');

    const children = categories.filter(
      (c) => c.parentId?.toString() === res!.id.toString(),
    );
    const names = children.map((c) => c.name);
    expect(names).toContain('Receitas Nao Operacionais');
    expect(names).toContain('Despesas Nao Operacionais');
  });

  it('should mark all seeded categories as isSystem', async () => {
    await sut.execute({ tenantId: 'tenant-1' });

    const categories = await repository.findMany('tenant-1');
    const nonSystemCategories = categories.filter((c) => !c.isSystem);
    expect(nonSystemCategories).toHaveLength(0);
  });

  it('should set correct displayOrder for DRE ordering', async () => {
    await sut.execute({ tenantId: 'tenant-1' });

    const categories = await repository.findMany('tenant-1');
    const sorted = [...categories].sort(
      (a, b) => a.displayOrder - b.displayOrder,
    );

    // Roots should come first in DRE order
    const rootCategories = sorted.filter((c) => !c.parentId);
    expect(rootCategories[0].name).toBe('Receita Operacional Bruta');
    expect(rootCategories[rootCategories.length - 1].name).toBe(
      'Resultado Nao Operacional',
    );

    // Every category should have a non-zero display order
    categories.forEach((c) => {
      expect(c.displayOrder).toBeGreaterThan(0);
    });
  });

  it('should set correct type (REVENUE/EXPENSE) on all categories', async () => {
    await sut.execute({ tenantId: 'tenant-1' });

    const categories = await repository.findMany('tenant-1');

    // Revenue root categories
    const receitaBruta = categories.find(
      (c) => c.name === 'Receita Operacional Bruta',
    );
    expect(receitaBruta!.type).toBe('REVENUE');

    // Expense root categories
    const despOp = categories.find((c) => c.name === 'Despesas Operacionais');
    expect(despOp!.type).toBe('EXPENSE');

    // CMV is EXPENSE
    const cmv = categories.find(
      (c) => c.name === 'Custos dos Produtos e Servicos',
    );
    expect(cmv!.type).toBe('EXPENSE');

    // Receitas Financeiras is REVENUE (even though positioned in the DRE between expenses)
    const recFin = categories.find((c) => c.name === 'Receitas Financeiras');
    expect(recFin!.type).toBe('REVENUE');
  });

  it('should be idempotent (no duplicates on second run)', async () => {
    const result1 = await sut.execute({ tenantId: 'tenant-1' });
    expect(result1.skipped).toBe(false);
    expect(result1.created).toBeGreaterThan(0);

    const result2 = await sut.execute({ tenantId: 'tenant-1' });
    expect(result2.skipped).toBe(true);
    expect(result2.created).toBe(0);

    const categories = await repository.findMany('tenant-1');
    expect(categories.length).toBe(result1.created);
  });

  it('should create categories for different tenants independently', async () => {
    await sut.execute({ tenantId: 'tenant-1' });
    await sut.execute({ tenantId: 'tenant-2' });

    const tenant1Categories = await repository.findMany('tenant-1');
    const tenant2Categories = await repository.findMany('tenant-2');

    expect(tenant1Categories.length).toBe(tenant2Categories.length);
    expect(tenant1Categories.length).toBeGreaterThan(0);
  });

  it('should generate proper slugs with PT-BR transliteration', async () => {
    await sut.execute({ tenantId: 'tenant-1' });

    const categories = await repository.findMany('tenant-1');

    const deducoes = categories.find((c) => c.name === 'Deducoes da Receita');
    expect(deducoes!.slug).toBe('deducoes-da-receita');

    const receitaBruta = categories.find(
      (c) => c.name === 'Receita Operacional Bruta',
    );
    expect(receitaBruta!.slug).toBe('receita-operacional-bruta');
  });

  it('should create exactly the expected number of categories', async () => {
    const result = await sut.execute({ tenantId: 'tenant-1' });

    // 7 roots + 14 children = 21 total
    // Receita Operacional (2), Deducoes (2), CMV (2), Despesas Op (3),
    // Despesas Fin (2), Receitas Fin (1), Resultado (2) = 14 children
    expect(result.created).toBe(21);
  });
});
