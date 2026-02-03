import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryCategoriesRepository } from '@/repositories/stock/in-memory/in-memory-categories-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateCategoryUseCase } from './create-category';
import { DeleteCategoryUseCase } from './delete-category';
import { GetCategoryByIdUseCase } from './get-category-by-id';

let categoriesRepository: InMemoryCategoriesRepository;
let createCategoryUseCase: CreateCategoryUseCase;
let getCategoryByIdUseCase: GetCategoryByIdUseCase;
let sut: DeleteCategoryUseCase;

describe('Delete Category Use Case', () => {
  beforeEach(() => {
    categoriesRepository = new InMemoryCategoriesRepository();
    createCategoryUseCase = new CreateCategoryUseCase(categoriesRepository);
    getCategoryByIdUseCase = new GetCategoryByIdUseCase(categoriesRepository);
    sut = new DeleteCategoryUseCase(categoriesRepository);
  });

  it('should delete a category (soft delete)', async () => {
    const { category } = await createCategoryUseCase.execute({
      tenantId: 'tenant-1',
      name: 'Electronics',
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      id: category.id.toString(),
    });

    expect(result.message).toBe('Category deleted successfully.');

    // Soft delete: a categoria ainda existe mas está marcada como deletada
    await expect(() =>
      getCategoryByIdUseCase.execute({
        tenantId: 'tenant-1',
        id: category.id.toString(),
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw error if category does not exist', async () => {
    await expect(() =>
      sut.execute({ tenantId: 'tenant-1', id: 'non-existent-id' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should delete a category with subcategories', async () => {
    const { category: parent } = await createCategoryUseCase.execute({
      tenantId: 'tenant-1',
      name: 'Electronics',
    });

    await createCategoryUseCase.execute({
      tenantId: 'tenant-1',
      name: 'Smartphones',
      parentId: parent.id.toString(),
    });

    await createCategoryUseCase.execute({
      tenantId: 'tenant-1',
      name: 'Laptops',
      parentId: parent.id.toString(),
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      id: parent.id.toString(),
    });

    expect(result.message).toBe('Category deleted successfully.');
  });
});
