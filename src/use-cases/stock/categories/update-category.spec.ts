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
      id: createdCategory.id.toString(),
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
      id: createdCategory.id.toString(),
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
      id: child.id.toString(),
      parentId: parent.id.toString(),
    });

    expect(updated.parentId).toEqual(parent.id);
  });

  it('should remove parent (make root category)', async () => {
    const { category: parent } = await createCategoryUseCase.execute({
      name: 'Electronics',
    });

    const { category: child } = await createCategoryUseCase.execute({
      name: 'Smartphones',
      parentId: parent.id.toString(),
    });

    const { category: updated } = await sut.execute({
      id: child.id.toString(),
      parentId: null,
    });

    expect(updated.parentId).toBeNull();
  });

  it('should update display order', async () => {
    const { category: createdCategory } = await createCategoryUseCase.execute({
      name: 'Electronics',
    });

    const { category } = await sut.execute({
      id: createdCategory.id.toString(),
      displayOrder: 5,
    });

    expect(category.displayOrder).toBe(5);
  });

  it('should update isActive status', async () => {
    const { category: createdCategory } = await createCategoryUseCase.execute({
      name: 'Electronics',
    });

    const { category } = await sut.execute({
      id: createdCategory.id.toString(),
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
        id: category.id.toString(),
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
        id: category.id.toString(),
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
        id: category.id.toString(),
        parentId: category.id.toString(),
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should not allow circular reference (subcategory as parent)', async () => {
    const { category: grandParent } = await createCategoryUseCase.execute({
      name: 'Electronics',
    });

    const { category: parent } = await createCategoryUseCase.execute({
      name: 'Mobile Devices',
      parentId: grandParent.id.toString(),
    });

    const { category: child } = await createCategoryUseCase.execute({
      name: 'Smartphones',
      parentId: parent.id.toString(),
    });

    // Tentando fazer o avô ser filho do neto (circular reference)
    await expect(() =>
      sut.execute({
        id: grandParent.id.toString(),
        parentId: child.id.toString(),
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should not allow updating to non-existent parent', async () => {
    const { category } = await createCategoryUseCase.execute({
      name: 'Electronics',
    });

    await expect(() =>
      sut.execute({
        id: category.id.toString(),
        parentId: 'non-existent-id',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
