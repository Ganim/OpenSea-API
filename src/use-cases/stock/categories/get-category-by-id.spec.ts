import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryCategoriesRepository } from '@/repositories/stock/in-memory/in-memory-categories-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateCategoryUseCase } from './create-category';
import { GetCategoryByIdUseCase } from './get-category-by-id';

let categoriesRepository: InMemoryCategoriesRepository;
let createCategoryUseCase: CreateCategoryUseCase;
let sut: GetCategoryByIdUseCase;

describe('Get Category By Id Use Case', () => {
  beforeEach(() => {
    categoriesRepository = new InMemoryCategoriesRepository();
    createCategoryUseCase = new CreateCategoryUseCase(categoriesRepository);
    sut = new GetCategoryByIdUseCase(categoriesRepository);
  });

  it('should get a category by id', async () => {
    const { category: createdCategory } = await createCategoryUseCase.execute({
      name: 'Electronics',
      description: 'Electronic products',
    });

    const { category } = await sut.execute({
      id: createdCategory.id.toString(),
    });

    expect(category).toEqual(createdCategory);
  });

  it('should throw error if category does not exist', async () => {
    await expect(() =>
      sut.execute({ id: 'non-existent-id' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
