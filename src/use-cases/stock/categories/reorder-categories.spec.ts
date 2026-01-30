import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryCategoriesRepository } from '@/repositories/stock/in-memory/in-memory-categories-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateCategoryUseCase } from './create-category';
import { ReorderCategoriesUseCase } from './reorder-categories';

let categoriesRepository: InMemoryCategoriesRepository;
let createCategoryUseCase: CreateCategoryUseCase;
let sut: ReorderCategoriesUseCase;

describe('Reorder Categories Use Case', () => {
  beforeEach(() => {
    categoriesRepository = new InMemoryCategoriesRepository();
    createCategoryUseCase = new CreateCategoryUseCase(categoriesRepository);
    sut = new ReorderCategoriesUseCase(categoriesRepository);
  });

  it('should reorder categories', async () => {
    const { category: cat1 } = await createCategoryUseCase.execute({
      name: 'Category A',
    });
    const { category: cat2 } = await createCategoryUseCase.execute({
      name: 'Category B',
    });
    const { category: cat3 } = await createCategoryUseCase.execute({
      name: 'Category C',
    });

    await sut.execute({
      items: [
        { id: cat1.id.toString(), displayOrder: 2 },
        { id: cat2.id.toString(), displayOrder: 0 },
        { id: cat3.id.toString(), displayOrder: 1 },
      ],
    });

    const updatedCat1 = await categoriesRepository.findById(cat1.id);
    const updatedCat2 = await categoriesRepository.findById(cat2.id);
    const updatedCat3 = await categoriesRepository.findById(cat3.id);

    expect(updatedCat1?.displayOrder).toBe(2);
    expect(updatedCat2?.displayOrder).toBe(0);
    expect(updatedCat3?.displayOrder).toBe(1);
  });

  it('should throw error if category does not exist', async () => {
    await expect(() =>
      sut.execute({
        items: [{ id: 'non-existent-id', displayOrder: 0 }],
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should reorder a single category', async () => {
    const { category } = await createCategoryUseCase.execute({
      name: 'Solo Category',
    });

    await sut.execute({
      items: [{ id: category.id.toString(), displayOrder: 5 }],
    });

    const updated = await categoriesRepository.findById(category.id);
    expect(updated?.displayOrder).toBe(5);
  });

  it('should handle empty items array', async () => {
    await sut.execute({ items: [] });
    // Should not throw
  });
});
