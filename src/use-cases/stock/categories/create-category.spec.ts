import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { InMemoryCategoriesRepository } from '@/repositories/stock/in-memory/in-memory-categories-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateCategoryUseCase } from './create-category';

let categoriesRepository: InMemoryCategoriesRepository;
let sut: CreateCategoryUseCase;

describe('Create Category Use Case', () => {
  const TENANT_ID = 'tenant-1';

  beforeEach(() => {
    categoriesRepository = new InMemoryCategoriesRepository();
    sut = new CreateCategoryUseCase(categoriesRepository);
  });

  // OBJECTIVE

  it('should create a category', async () => {
    const { category } = await sut.execute({
      tenantId: TENANT_ID,
      name: 'Electronics',
      description: 'Electronic products',
    });

    expect(category.id.toString()).toEqual(expect.any(String));
    expect(category.name).toBe('Electronics');
    expect(category.slug).toBe('electronics');
    expect(category.description).toBe('Electronic products');
    expect(category.isActive).toBe(true);
  });

  it('should create a category with custom slug', async () => {
    const { category } = await sut.execute({
      tenantId: TENANT_ID,
      name: 'Eletrônicos',
      slug: 'eletronicos-custom',
    });

    expect(category.slug).toBe('eletronicos-custom');
  });

  it('should create a subcategory', async () => {
    const { category: parentCategory } = await sut.execute({
      tenantId: 'tenant-1',
      name: 'Electronics',
    });

    const { category: subCategory } = await sut.execute({
      tenantId: 'tenant-1',
      name: 'Smartphones',
      parentId: parentCategory.id.toString(),
    });

    expect(subCategory.id.toString()).toEqual(expect.any(String));
    expect(subCategory.name).toBe('Smartphones');
    expect(subCategory.parentId).toEqual(parentCategory.id);
  });

  it('should generate slug from name automatically', async () => {
    const { category } = await sut.execute({
      tenantId: 'tenant-1',
      name: 'Eletrônicos & Tecnologia',
    });

    expect(category.slug).toBe('eletronicos-tecnologia');
  });

  // REJECTS

  it('should not allow creating a category with an existing name', async () => {
    const name = 'Electronics';

    await sut.execute({ tenantId: 'tenant-1', name });

    await expect(() =>
      sut.execute({ tenantId: 'tenant-1', name }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should not allow creating a category with an existing slug', async () => {
    await sut.execute({
      tenantId: 'tenant-1',
      name: 'Electronics',
      slug: 'electronics',
    });

    await expect(() =>
      sut.execute({
        tenantId: 'tenant-1',
        name: 'Eletrônicos',
        slug: 'electronics',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should not allow creating a category with non-existent parent', async () => {
    await expect(() =>
      sut.execute({
        tenantId: 'tenant-1',
        name: 'Smartphones',
        parentId: 'non-existent-id',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  // VALIDATIONS

  it('should create a category with iconUrl', async () => {
    const { category } = await sut.execute({
      tenantId: 'tenant-1',
      name: 'Category With Icon',
      iconUrl: 'https://example.com/icons/category.svg',
    });

    expect(category.iconUrl).toBe('https://example.com/icons/category.svg');
  });

  it('should create a category without iconUrl (defaults to null)', async () => {
    const { category } = await sut.execute({
      tenantId: 'tenant-1',
      name: 'Category Without Icon',
    });

    expect(category.iconUrl).toBeNull();
  });

  it('should create inactive category when specified', async () => {
    const { category } = await sut.execute({
      tenantId: 'tenant-1',
      name: 'Inactive Category',
      isActive: false,
    });

    expect(category.isActive).toBe(false);
  });

  it('should set display order when specified', async () => {
    const { category } = await sut.execute({
      tenantId: 'tenant-1',
      name: 'Featured Category',
      displayOrder: 1,
    });

    expect(category.displayOrder).toBe(1);
  });

  it('should normalize slug with special characters', async () => {
    const { category } = await sut.execute({
      tenantId: 'tenant-1',
      name: 'Áudio & Vídeo - Ñoño',
    });

    expect(category.slug).toBe('audio-video-nono');
  });
});
