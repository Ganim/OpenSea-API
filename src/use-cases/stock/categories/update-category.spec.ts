import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryCategoriesRepository } from '@/repositories/stock/in-memory/in-memory-categories-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateCategoryUseCase } from './create-category';
import { UpdateCategoryUseCase } from './update-category';

let categoriesRepository: InMemoryCategoriesRepository;
let createCategoryUseCase: CreateCategoryUseCase;
let sut: UpdateCategoryUseCase;

describe('Update Category Use Case', () => {
  beforeEach(() => {
    categoriesRepository = new InMemoryCategoriesRepository();
    createCategoryUseCase = new CreateCategoryUseCase(categoriesRepository);
    sut = new UpdateCategoryUseCase(categoriesRepository);
  });

  it('should update a category', async () => {
    const { category: createdCategory } = await createCategoryUseCase.execute({
      name: 'Electronics',
    });

    const { category } = await sut.execute({
      id: createdCategory.id,
      name: 'Consumer Electronics',
      description: 'Updated description',
    });

    expect(category.name).toBe('Consumer Electronics');
    expect(category.description).toBe('Updated description');
  });

  it('should update category slug', async () => {
    const { category: createdCategory } = await createCategoryUseCase.execute({
      name: 'Electronics',
    });

    const { category } = await sut.execute({
      id: createdCategory.id,
      slug: 'consumer-electronics',
    });

    expect(category.slug).toBe('consumer-electronics');
  });

  it('should update category parent', async () => {
    const { category: parent } = await createCategoryUseCase.execute({
      name: 'Electronics',
    });

    const { category: child } = await createCategoryUseCase.execute({
      name: 'Smartphones',
    });

    const { category: updated } = await sut.execute({
      id: child.id,
      parentId: parent.id,
    });

    expect(updated.parentId).toBe(parent.id);
  });

  it('should remove parent (make root category)', async () => {
    const { category: parent } = await createCategoryUseCase.execute({
      name: 'Electronics',
    });

    const { category: child } = await createCategoryUseCase.execute({
      name: 'Smartphones',
      parentId: parent.id,
    });

    const { category: updated } = await sut.execute({
      id: child.id,
      parentId: null,
    });

    expect(updated.parentId).toBeNull();
  });

  it('should update display order', async () => {
    const { category: createdCategory } = await createCategoryUseCase.execute({
      name: 'Electronics',
    });

    const { category } = await sut.execute({
      id: createdCategory.id,
      displayOrder: 5,
    });

    expect(category.displayOrder).toBe(5);
  });

  it('should update isActive status', async () => {
    const { category: createdCategory } = await createCategoryUseCase.execute({
      name: 'Electronics',
    });

    const { category } = await sut.execute({
      id: createdCategory.id,
      isActive: false,
    });

    expect(category.isActive).toBe(false);
  });

  // REJECTS

  it('should throw error if category does not exist', async () => {
    await expect(() =>
      sut.execute({
        id: 'non-existent-id',
        name: 'Updated Name',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should not allow updating to an existing name', async () => {
    await createCategoryUseCase.execute({ name: 'Electronics' });
    const { category } = await createCategoryUseCase.execute({
      name: 'Clothing',
    });

    await expect(() =>
      sut.execute({
        id: category.id,
        name: 'Electronics',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should not allow updating to an existing slug', async () => {
    await createCategoryUseCase.execute({
      name: 'Electronics',
      slug: 'electronics',
    });
    const { category } = await createCategoryUseCase.execute({
      name: 'Clothing',
      slug: 'clothing',
    });

    await expect(() =>
      sut.execute({
        id: category.id,
        slug: 'electronics',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should not allow a category to be its own parent', async () => {
    const { category } = await createCategoryUseCase.execute({
      name: 'Electronics',
    });

    await expect(() =>
      sut.execute({
        id: category.id,
        parentId: category.id,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should not allow circular reference (subcategory as parent)', async () => {
    const { category: grandParent } = await createCategoryUseCase.execute({
      name: 'Electronics',
    });

    const { category: parent } = await createCategoryUseCase.execute({
      name: 'Mobile Devices',
      parentId: grandParent.id,
    });

    const { category: child } = await createCategoryUseCase.execute({
      name: 'Smartphones',
      parentId: parent.id,
    });

    // Tentando fazer o avô ser filho do neto (circular reference)
    await expect(() =>
      sut.execute({
        id: grandParent.id,
        parentId: child.id,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should not allow updating to non-existent parent', async () => {
    const { category } = await createCategoryUseCase.execute({
      name: 'Electronics',
    });

    await expect(() =>
      sut.execute({
        id: category.id,
        parentId: 'non-existent-id',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
