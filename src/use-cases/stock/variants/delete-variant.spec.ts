import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryCategoriesRepository } from '@/repositories/stock/in-memory/in-memory-categories-repository';
import { InMemoryManufacturersRepository } from '@/repositories/stock/in-memory/in-memory-manufacturers-repository';
import { InMemoryProductsRepository } from '@/repositories/stock/in-memory/in-memory-products-repository';
import { InMemorySuppliersRepository } from '@/repositories/stock/in-memory/in-memory-suppliers-repository';
import { InMemoryTemplatesRepository } from '@/repositories/stock/in-memory/in-memory-templates-repository';
import { InMemoryVariantsRepository } from '@/repositories/stock/in-memory/in-memory-variants-repository';
import type { CareCatalogProvider } from '@/services/care';
import { templateAttr } from '@/utils/tests/factories/stock/make-template';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateProductUseCase } from '../products/create-product';
import { CreateTemplateUseCase } from '../templates/create-template';
import { CreateVariantUseCase } from './create-variant';
import { DeleteVariantUseCase } from './delete-variant';

let variantsRepository: InMemoryVariantsRepository;
let productsRepository: InMemoryProductsRepository;
let templatesRepository: InMemoryTemplatesRepository;
let suppliersRepository: InMemorySuppliersRepository;
let manufacturersRepository: InMemoryManufacturersRepository;
let categoriesRepository: InMemoryCategoriesRepository;
let deleteVariant: DeleteVariantUseCase;
let createVariant: CreateVariantUseCase;
let createProduct: CreateProductUseCase;
let createTemplate: CreateTemplateUseCase;

const mockCareCatalog = {
  validateIds: (ids: string[]) =>
    ids.filter(
      (id) =>
        !id.startsWith('WASH') &&
        !id.startsWith('IRON') &&
        !id.startsWith('DRY') &&
        !id.startsWith('BLEACH') &&
        !id.startsWith('DO_NOT'),
    ),
  exists: (id: string) =>
    id.startsWith('WASH') ||
    id.startsWith('IRON') ||
    id.startsWith('DRY') ||
    id.startsWith('BLEACH') ||
    id.startsWith('DO_NOT'),
} as unknown as CareCatalogProvider;

describe('DeleteVariantUseCase', () => {
  beforeEach(() => {
    variantsRepository = new InMemoryVariantsRepository();
    productsRepository = new InMemoryProductsRepository();
    templatesRepository = new InMemoryTemplatesRepository();
    suppliersRepository = new InMemorySuppliersRepository();
    manufacturersRepository = new InMemoryManufacturersRepository();
    categoriesRepository = new InMemoryCategoriesRepository();
    deleteVariant = new DeleteVariantUseCase(variantsRepository);
    createVariant = new CreateVariantUseCase(
      variantsRepository,
      productsRepository,
      templatesRepository,
    );
    createProduct = new CreateProductUseCase(
      productsRepository,
      templatesRepository,
      suppliersRepository,
      manufacturersRepository,
      categoriesRepository,
      mockCareCatalog,
    );
    createTemplate = new CreateTemplateUseCase(templatesRepository);
  });

  it('should be able to delete a variant', async () => {
    const { template } = await createTemplate.execute({
      tenantId: 'tenant-1',
      name: 'Test Template',
      productAttributes: { brand: templateAttr.string() },
    });

    const { product } = await createProduct.execute({
      tenantId: 'tenant-1',
      name: 'Test Product',

      status: 'ACTIVE',
      attributes: {},
      templateId: template.id.toString(),
    });

    const variant = await createVariant.execute({
      tenantId: 'tenant-1',
      productId: product.id.toString(),
      sku: 'SKU-001',
      name: 'Test Variant',
      price: 100,
    });

    await deleteVariant.execute({
      tenantId: 'tenant-1',
      id: variant.id.toString(),
    });

    const deletedVariant = await variantsRepository.findById(
      new UniqueEntityID(variant.id.toString()),
      'tenant-1',
    );
    expect(deletedVariant).toBeNull();
  });

  it('should throw error if variant not found', async () => {
    await expect(() =>
      deleteVariant.execute({
        tenantId: 'tenant-1',
        id: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
