import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryManufacturersRepository } from '@/repositories/stock/in-memory/in-memory-manufacturers-repository';
import { InMemoryProductsRepository } from '@/repositories/stock/in-memory/in-memory-products-repository';
import { InMemorySuppliersRepository } from '@/repositories/stock/in-memory/in-memory-suppliers-repository';
import { InMemoryTemplatesRepository } from '@/repositories/stock/in-memory/in-memory-templates-repository';
import { InMemoryVariantsRepository } from '@/repositories/stock/in-memory/in-memory-variants-repository';
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
let updateVariant: UpdateVariantUseCase;
let createVariant: CreateVariantUseCase;
let createProduct: CreateProductUseCase;
let createTemplate: CreateTemplateUseCase;

describe('UpdateVariantUseCase', () => {
  beforeEach(() => {
    variantsRepository = new InMemoryVariantsRepository();
    productsRepository = new InMemoryProductsRepository();
    templatesRepository = new InMemoryTemplatesRepository();
    suppliersRepository = new InMemorySuppliersRepository();
    manufacturersRepository = new InMemoryManufacturersRepository();
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
    );
    createTemplate = new CreateTemplateUseCase(templatesRepository);
  });

  it('should be able to update a variant', async () => {
    const { template } = await createTemplate.execute({
      name: 'Test Template',
      productAttributes: { brand: 'string' },
    });

    const { product } = await createProduct.execute({
      name: 'Test Product',
      code: 'PROD-001',
      status: 'ACTIVE',
      attributes: {},
      templateId: template.id.toString(),
    });

    const variant = await createVariant.execute({
      productId: product.id.toString(),
      sku: 'SKU-001',
      name: 'Original Name',
      price: 100,
    });

    const result = await updateVariant.execute({
      id: variant.id.toString(),
      name: 'Updated Name',
      price: 150,
    });

    expect(result.name).toBe('Updated Name');
    expect(result.price).toBe(150);
  });

  it('should be able to update variant partially', async () => {
    const { template } = await createTemplate.execute({
      name: 'Test Template',
      productAttributes: { brand: 'string' },
    });

    const { product } = await createProduct.execute({
      name: 'Test Product',
      code: 'PROD-001',
      status: 'ACTIVE',
      attributes: {},
      templateId: template.id.toString(),
    });

    const variant = await createVariant.execute({
      productId: product.id.toString(),
      sku: 'SKU-001',
      name: 'Original Name',
      price: 100,
    });

    const result = await updateVariant.execute({
      id: variant.id.toString(),
      price: 200,
    });

    expect(result.name).toBe('Original Name');
    expect(result.price).toBe(200);
  });

  it('should throw error if variant not found', async () => {
    await expect(() =>
      updateVariant.execute({
        id: new UniqueEntityID().toString(),
        name: 'Updated Name',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should not allow updating to empty name', async () => {
    const { template } = await createTemplate.execute({
      name: 'Test Template',
      productAttributes: { brand: 'string' },
    });

    const { product } = await createProduct.execute({
      name: 'Test Product',
      code: 'PROD-001',
      status: 'ACTIVE',
      attributes: {},
      templateId: template.id.toString(),
    });

    const variant = await createVariant.execute({
      productId: product.id.toString(),
      sku: 'SKU-001',
      name: 'Original Name',
      price: 100,
    });

    await expect(() =>
      updateVariant.execute({
        id: variant.id.toString(),
        name: '',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not allow duplicate SKU', async () => {
    const { template } = await createTemplate.execute({
      name: 'Test Template',
      productAttributes: { brand: 'string' },
    });

    const { product } = await createProduct.execute({
      name: 'Test Product',
      code: 'PROD-001',
      status: 'ACTIVE',
      attributes: {},
      templateId: template.id.toString(),
    });

    await createVariant.execute({
      productId: product.id.toString(),
      sku: 'SKU-001',
      name: 'Variant 1',
      price: 100,
    });

    const variant2 = await createVariant.execute({
      productId: product.id.toString(),
      sku: 'SKU-002',
      name: 'Variant 2',
      price: 200,
    });

    await expect(() =>
      updateVariant.execute({
        id: variant2.id.toString(),
        sku: 'SKU-001',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not allow negative price', async () => {
    const { template } = await createTemplate.execute({
      name: 'Test Template',
      productAttributes: { brand: 'string' },
    });

    const { product } = await createProduct.execute({
      name: 'Test Product',
      code: 'PROD-001',
      status: 'ACTIVE',
      attributes: {},
      templateId: template.id.toString(),
    });

    const variant = await createVariant.execute({
      productId: product.id.toString(),
      sku: 'SKU-001',
      name: 'Test Variant',
      price: 100,
    });

    await expect(() =>
      updateVariant.execute({
        id: variant.id.toString(),
        price: -10,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not allow invalid profit margin', async () => {
    const { template } = await createTemplate.execute({
      name: 'Test Template',
      productAttributes: { brand: 'string' },
    });

    const { product } = await createProduct.execute({
      name: 'Test Product',
      code: 'PROD-001',
      status: 'ACTIVE',
      attributes: {},
      templateId: template.id.toString(),
    });

    const variant = await createVariant.execute({
      productId: product.id.toString(),
      sku: 'SKU-001',
      name: 'Test Variant',
      price: 100,
    });

    await expect(() =>
      updateVariant.execute({
        id: variant.id.toString(),
        profitMargin: 150,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not allow minStock > maxStock', async () => {
    const { template } = await createTemplate.execute({
      name: 'Test Template',
      productAttributes: { brand: 'string' },
    });

    const { product } = await createProduct.execute({
      name: 'Test Product',
      code: 'PROD-001',
      status: 'ACTIVE',
      attributes: {},
      templateId: template.id.toString(),
    });

    const variant = await createVariant.execute({
      productId: product.id.toString(),
      sku: 'SKU-001',
      name: 'Test Variant',
      price: 100,
    });

    await expect(() =>
      updateVariant.execute({
        id: variant.id.toString(),
        minStock: 100,
        maxStock: 50,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not allow invalid variant attributes not in template', async () => {
    const { template } = await createTemplate.execute({
      name: 'Electronics Template',
      productAttributes: { brand: 'string' },
      variantAttributes: { color: 'string' },
    });

    const { product } = await createProduct.execute({
      name: 'Smartphone',
      code: 'PHONE-001',
      status: 'ACTIVE',
      attributes: { brand: 'Samsung' },
      templateId: template.id.toString(),
    });

    const variant = await createVariant.execute({
      productId: product.id.toString(),
      sku: 'PHONE-001-BLK',
      name: 'Smartphone Black',
      price: 999.99,
      attributes: { color: 'Black' },
    });

    await expect(() =>
      updateVariant.execute({
        id: variant.id.toString(),
        attributes: { color: 'White', invalidKey: 'InvalidValue' },
      }),
    ).rejects.toThrow(BadRequestError);
  });
});
