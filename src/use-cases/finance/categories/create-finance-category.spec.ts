import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ErrorCodes } from '@/@errors/error-codes';
import { InMemoryFinanceCategoriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-categories-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateFinanceCategoryUseCase } from './create-finance-category';

let repository: InMemoryFinanceCategoriesRepository;
let sut: CreateFinanceCategoryUseCase;

describe('CreateFinanceCategoryUseCase', () => {
  beforeEach(() => {
    repository = new InMemoryFinanceCategoriesRepository();
    sut = new CreateFinanceCategoryUseCase(repository);
  });

  it('should create a finance category', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      name: 'Aluguel',
      type: 'EXPENSE',
    });

    expect(result.category).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        name: 'Aluguel',
        slug: 'aluguel',
        type: 'EXPENSE',
        isActive: true,
        isSystem: false,
      }),
    );
  });

  it('should create with all fields', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      name: 'Vendas',
      slug: 'vendas-produtos',
      description: 'Receita de vendas',
      type: 'REVENUE',
      color: '#22C55E',
      displayOrder: 5,
    });

    expect(result.category.slug).toBe('vendas-produtos');
    expect(result.category.description).toBe('Receita de vendas');
    expect(result.category.displayOrder).toBe(5);
  });

  it('should auto-generate slug from name with PT-BR transliteration', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      name: 'Material de Escritorio',
      type: 'EXPENSE',
    });

    expect(result.category.slug).toBe('material-de-escritorio');
  });

  it('should transliterate all PT-BR accented characters in slug', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      name: 'Manutencao e Reparacao de Veiculos',
      type: 'EXPENSE',
    });

    expect(result.category.slug).toBe('manutencao-e-reparacao-de-veiculos');
  });

  it('should not create with empty name', async () => {
    await expect(
      sut.execute({ tenantId: 'tenant-1', name: '', type: 'EXPENSE' }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not create with invalid type', async () => {
    await expect(
      sut.execute({ tenantId: 'tenant-1', name: 'Test', type: 'INVALID' }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not create with duplicate slug', async () => {
    await sut.execute({
      tenantId: 'tenant-1',
      name: 'Aluguel',
      slug: 'aluguel',
      type: 'EXPENSE',
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        name: 'Aluguel 2',
        slug: 'aluguel',
        type: 'EXPENSE',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should create BOTH type category', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      name: 'Transferencias',
      type: 'BOTH',
    });

    expect(result.category.type).toBe('BOTH');
  });

  it('should throw duplicate slug error with correct error code', async () => {
    await sut.execute({
      tenantId: 'tenant-1',
      name: 'Aluguel',
      slug: 'aluguel',
      type: 'EXPENSE',
    });

    try {
      await sut.execute({
        tenantId: 'tenant-1',
        name: 'Aluguel Novo',
        slug: 'aluguel',
        type: 'EXPENSE',
      });
      expect.unreachable('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestError);
      expect((error as BadRequestError).code).toBe(
        ErrorCodes.FINANCE_CATEGORY_DUPLICATE_SLUG,
      );
    }
  });

  it('should include error codes on all thrown errors', async () => {
    try {
      await sut.execute({ tenantId: 'tenant-1', name: '', type: 'EXPENSE' });
      expect.unreachable('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestError);
      expect((error as BadRequestError).code).toBe(ErrorCodes.BAD_REQUEST);
    }
  });

  // --- Hierarchy depth enforcement ---

  it('should create a category at depth 2 (child of root)', async () => {
    const root = await sut.execute({
      tenantId: 'tenant-1',
      name: 'Despesas Operacionais',
      type: 'EXPENSE',
    });

    const child = await sut.execute({
      tenantId: 'tenant-1',
      name: 'Pessoal',
      slug: 'pessoal',
      type: 'EXPENSE',
      parentId: root.category.id,
    });

    expect(child.category.parentId).toBe(root.category.id);
  });

  it('should create a category at depth 3 (grandchild)', async () => {
    const root = await sut.execute({
      tenantId: 'tenant-1',
      name: 'Despesas Operacionais',
      type: 'EXPENSE',
    });

    const child = await sut.execute({
      tenantId: 'tenant-1',
      name: 'Pessoal',
      slug: 'pessoal',
      type: 'EXPENSE',
      parentId: root.category.id,
    });

    const grandchild = await sut.execute({
      tenantId: 'tenant-1',
      name: 'Salarios',
      slug: 'salarios',
      type: 'EXPENSE',
      parentId: child.category.id,
    });

    expect(grandchild.category.parentId).toBe(child.category.id);
  });

  it('should reject creating a category at depth 4 (great-grandchild)', async () => {
    const root = await sut.execute({
      tenantId: 'tenant-1',
      name: 'Despesas Operacionais',
      type: 'EXPENSE',
    });

    const child = await sut.execute({
      tenantId: 'tenant-1',
      name: 'Pessoal',
      slug: 'pessoal',
      type: 'EXPENSE',
      parentId: root.category.id,
    });

    const grandchild = await sut.execute({
      tenantId: 'tenant-1',
      name: 'Salarios',
      slug: 'salarios',
      type: 'EXPENSE',
      parentId: child.category.id,
    });

    try {
      await sut.execute({
        tenantId: 'tenant-1',
        name: 'Hora Extra',
        slug: 'hora-extra',
        type: 'EXPENSE',
        parentId: grandchild.category.id,
      });
      expect.unreachable('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestError);
      expect((error as BadRequestError).code).toBe(
        ErrorCodes.FINANCE_CATEGORY_MAX_DEPTH,
      );
    }
  });

  it('should create an isSystem category', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      name: 'Receita Operacional',
      type: 'REVENUE',
      isSystem: true,
    });

    expect(result.category.isSystem).toBe(true);
  });
});
