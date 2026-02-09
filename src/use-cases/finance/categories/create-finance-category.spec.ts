import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
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

  it('should auto-generate slug from name', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      name: 'Material de Escritório',
      type: 'EXPENSE',
    });

    expect(result.category.slug).toBe('material-de-escritrio');
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
      name: 'Transferências',
      type: 'BOTH',
    });

    expect(result.category.type).toBe('BOTH');
  });
});
