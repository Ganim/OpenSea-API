import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
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
import { UpdateVariantUseCase } from './update-variant';

let variantsRepository: InMemoryVariantsRepository;
let productsRepository: InMemoryProductsRepository;
let templatesRepository: InMemoryTemplatesRepository;
let suppliersRepository: InMemorySuppliersRepository;
let manufacturersRepository: InMemoryManufacturersRepository;
let categoriesRepository: InMemoryCategoriesRepository;
let updateVariant: UpdateVariantUseCase;
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

describe('UpdateVariantUseCase', () => {
  beforeEach(() => {
    variantsRepository = new InMemoryVariantsRepository();
    productsRepository = new InMemoryProductsRepository();
    templatesRepository = new InMemoryTemplatesRepository();
    suppliersRepository = new InMemorySuppliersRepository();
    manufacturersRepository = new InMemoryManufacturersRepository();
    categoriesRepository = new InMemoryCategoriesRepository();
    updateVariant = new UpdateVariantUseCase(
      variantsRepository,
      productsRepository,
      templatesRepository,
    );
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

  it('should be able to update a variant', async () => {
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
      name: 'Original Name',
      price: 100,
    });

    const result = await updateVariant.execute({
      tenantId: 'tenant-1',
      id: variant.id.toString(),
      name: 'Updated Name',
      price: 150,
    });

    expect(result.name).toBe('Updated Name');
    expect(result.price).toBe(150);
  });

  it('should be able to update variant partially', async () => {
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
      name: 'Original Name',
      price: 100,
    });

    const result = await updateVariant.execute({
      tenantId: 'tenant-1',
      id: variant.id.toString(),
      price: 200,
    });

    expect(result.name).toBe('Original Name');
    expect(result.price).toBe(200);
  });

  it('should throw error if variant not found', async () => {
    await expect(() =>
      updateVariant.execute({
        tenantId: 'tenant-1',
        id: new UniqueEntityID().toString(),
        name: 'Updated Name',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should not allow updating to empty name', async () => {
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
      name: 'Original Name',
      price: 100,
    });

    await expect(() =>
      updateVariant.execute({
        tenantId: 'tenant-1',
        id: variant.id.toString(),
        name: '',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not allow duplicate SKU', async () => {
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

    await createVariant.execute({
      tenantId: 'tenant-1',
      productId: product.id.toString(),
      sku: 'SKU-001',
      name: 'Variant 1',
      price: 100,
    });

    const variant2 = await createVariant.execute({
      tenantId: 'tenant-1',
      productId: product.id.toString(),
      sku: 'SKU-002',
      name: 'Variant 2',
      price: 200,
    });

    await expect(() =>
      updateVariant.execute({
        tenantId: 'tenant-1',
        id: variant2.id.toString(),
        sku: 'SKU-001',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not allow negative price', async () => {
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

    await expect(() =>
      updateVariant.execute({
        tenantId: 'tenant-1',
        id: variant.id.toString(),
        price: -10,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not allow invalid profit margin', async () => {
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

    await expect(() =>
      updateVariant.execute({
        tenantId: 'tenant-1',
        id: variant.id.toString(),
        profitMargin: 150,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not allow minStock > maxStock', async () => {
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

    await expect(() =>
      updateVariant.execute({
        tenantId: 'tenant-1',
        id: variant.id.toString(),
        minStock: 100,
        maxStock: 50,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not allow invalid variant attributes not in template', async () => {
    const { template } = await createTemplate.execute({
      tenantId: 'tenant-1',
      name: 'Electronics Template',
      productAttributes: { brand: templateAttr.string() },
      variantAttributes: { color: templateAttr.string() },
    });

    const { product } = await createProduct.execute({
      tenantId: 'tenant-1',
      name: 'Smartphone',

      status: 'ACTIVE',
      attributes: { brand: 'Samsung' },
      templateId: template.id.toString(),
    });

    const variant = await createVariant.execute({
      tenantId: 'tenant-1',
      productId: product.id.toString(),
      sku: 'PHONE-001-BLK',
      name: 'Smartphone Black',
      price: 999.99,
      attributes: { color: 'Black' },
    });

    await expect(() =>
      updateVariant.execute({
        tenantId: 'tenant-1',
        id: variant.id.toString(),
        attributes: { color: 'White', invalidKey: 'InvalidValue' },
      }),
    ).rejects.toThrow(BadRequestError);
  });
});
