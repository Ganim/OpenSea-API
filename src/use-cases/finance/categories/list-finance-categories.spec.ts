import { InMemoryFinanceCategoriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-categories-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListFinanceCategoriesUseCase } from './list-finance-categories';

let repository: InMemoryFinanceCategoriesRepository;
let sut: ListFinanceCategoriesUseCase;

describe('ListFinanceCategoriesUseCase', () => {
  beforeEach(() => {
    repository = new InMemoryFinanceCategoriesRepository();
    sut = new ListFinanceCategoriesUseCase(repository);
  });

  it('should list finance categories', async () => {
    await repository.create({
      tenantId: 'tenant-1',
      name: 'Aluguel',
      slug: 'aluguel',
      type: 'EXPENSE',
    });

    await repository.create({
      tenantId: 'tenant-1',
      name: 'Vendas',
      slug: 'vendas',
      type: 'REVENUE',
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
    });

    expect(result.categories).toHaveLength(2);
    expect(result.categories[0].name).toBe('Aluguel');
    expect(result.categories[1].name).toBe('Vendas');
  });

  it('should return empty array if no categories', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
    });

    expect(result.categories).toHaveLength(0);
    expect(result.categories).toEqual([]);
  });
});
