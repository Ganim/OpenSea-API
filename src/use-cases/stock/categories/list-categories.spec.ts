import { InMemoryCategoriesRepository } from '@/repositories/stock/in-memory/in-memory-categories-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateCategoryUseCase } from './create-category';
import { ListCategoriesUseCase } from './list-categories';

let categoriesRepository: InMemoryCategoriesRepository;
let createCategoryUseCase: CreateCategoryUseCase;
let sut: ListCategoriesUseCase;

describe('List Categories Use Case', () => {
  beforeEach(() => {
    categoriesRepository = new InMemoryCategoriesRepository();
    createCategoryUseCase = new CreateCategoryUseCase(categoriesRepository);
    sut = new ListCategoriesUseCase(categoriesRepository);
  });

  it('should list all categories', async () => {
    await createCategoryUseCase.execute({
      tenantId: 'tenant-1',
      name: 'Electronics',
    });
    await createCategoryUseCase.execute({
      tenantId: 'tenant-1',
      name: 'Clothing',
    });
    await createCategoryUseCase.execute({
      tenantId: 'tenant-1',
      name: 'Books',
    });

    const { categories } = await sut.execute({ tenantId: 'tenant-1' });

    expect(categories).toHaveLength(3);
    expect(categories[0].name).toBe('Electronics');
    expect(categories[1].name).toBe('Clothing');
    expect(categories[2].name).toBe('Books');
  });

  it('should return empty array when no categories exist', async () => {
    const { categories } = await sut.execute({ tenantId: 'tenant-1' });

    expect(categories).toEqual([]);
  });
});
