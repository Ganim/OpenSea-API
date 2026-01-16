import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryManufacturersRepository } from '@/repositories/stock/in-memory/in-memory-manufacturers-repository';
import { InMemoryProductsRepository } from '@/repositories/stock/in-memory/in-memory-products-repository';
import { InMemorySuppliersRepository } from '@/repositories/stock/in-memory/in-memory-suppliers-repository';
import { InMemoryTemplatesRepository } from '@/repositories/stock/in-memory/in-memory-templates-repository';
import { InMemoryVariantsRepository } from '@/repositories/stock/in-memory/in-memory-variants-repository';
import { templateAttr } from '@/utils/tests/factories/stock/make-template';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateProductUseCase } from '../products/create-product';
import { CreateTemplateUseCase } from '../templates/create-template';
import { CreateVariantUseCase } from './create-variant';

let variantsRepository: InMemoryVariantsRepository;
let productsRepository: InMemoryProductsRepository;
let templatesRepository: InMemoryTemplatesRepository;
let suppliersRepository: InMemorySuppliersRepository;
let manufacturersRepository: InMemoryManufacturersRepository;
let createVariant: CreateVariantUseCase;
let createProduct: CreateProductUseCase;
let createTemplate: CreateTemplateUseCase;

describe('CreateVariantUseCase', () => {
  beforeEach(() => {
    variantsRepository = new InMemoryVariantsRepository();
    productsRepository = new InMemoryProductsRepository();
    templatesRepository = new InMemoryTemplatesRepository();
    suppliersRepository = new InMemorySuppliersRepository();
    manufacturersRepository = new InMemoryManufacturersRepository();
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

  it('should be able to create a variant', async () => {
    const { template } = await createTemplate.execute({
      name: 'Electronics Template',
      productAttributes: { brand: templateAttr.string() },
      variantAttributes: { color: templateAttr.string(), storage: templateAttr.string() },
    });

    const { product } = await createProduct.execute({
      name: 'Smartphone',
      code: 'PHONE-001',
      status: 'ACTIVE',
      attributes: { brand: 'Samsung' },
      templateId: template.id.toString(),
    });

    const result = await createVariant.execute({
      productId: product.id.toString(),
      sku: 'PHONE-001-BLK-128',
      name: 'Smartphone Black 128GB',
      price: 999.99,
      attributes: { color: 'Black', storage: '128GB' },
    });

    expect(result).toBeDefined();
    expect(result.sku).toBe('PHONE-001-BLK-128');
    expect(result.name).toBe('Smartphone Black 128GB');
    expect(result.price).toBe(999.99);
    expect(result.productId.toString()).toBe(product.id.toString());
  });

  it('should be able to create a variant with all optional fields', async () => {
    const { template } = await createTemplate.execute({
      name: 'Electronics Template',
      productAttributes: { brand: templateAttr.string() },
      variantAttributes: { color: templateAttr.string() },
    });

    const { product } = await createProduct.execute({
      name: 'Smartphone',
      code: 'PHONE-001',
      status: 'ACTIVE',
      attributes: { brand: 'Samsung' },
      templateId: template.id.toString(),
    });

    const result = await createVariant.execute({
      productId: product.id.toString(),
      sku: 'PHONE-001-BLK',
      name: 'Smartphone Black',
      price: 999.99,
      imageUrl: 'https://example.com/phone.jpg',
      attributes: { color: 'Black' },
      costPrice: 600,
      profitMargin: 40,
      barcode: '123456789012',
      qrCode: 'QR123456',
      eanCode: '1234567890123',
      upcCode: '123456789012',
      minStock: 10,
      maxStock: 100,
      reorderPoint: 20,
      reorderQuantity: 50,
    });

    expect(result.costPrice).toBe(600);
    expect(result.profitMargin).toBe(40);
    expect(result.barcode).toBe('123456789012');
    expect(result.eanCode).toBe('1234567890123');
    expect(result.upcCode).toBe('123456789012');
    expect(result.minStock).toBe(10);
    expect(result.maxStock).toBe(100);
  });

  it('should not allow creating variant with SKU exceeding 64 characters', async () => {
    const { template } = await createTemplate.execute({
      name: 'Test Template',
      productAttributes: { brand: templateAttr.string() },
    });

    const { product } = await createProduct.execute({
      name: 'Test Product',
      code: 'PROD-001',
      status: 'ACTIVE',
      attributes: {},
      templateId: template.id.toString(),
    });

    await expect(() =>
      createVariant.execute({
        productId: product.id.toString(),
        sku: 'A'.repeat(65),
        name: 'Test Variant',
        price: 100,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not allow creating variant with empty name', async () => {
    const { template } = await createTemplate.execute({
      name: 'Test Template',
      productAttributes: { brand: templateAttr.string() },
    });

    const { product } = await createProduct.execute({
      name: 'Test Product',
      code: 'PROD-001',
      status: 'ACTIVE',
      attributes: {},
      templateId: template.id.toString(),
    });

    await expect(() =>
      createVariant.execute({
        productId: product.id.toString(),
        sku: 'SKU-001',
        name: '',
        price: 100,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not allow creating variant with name exceeding 256 characters', async () => {
    const { template } = await createTemplate.execute({
      name: 'Test Template',
      productAttributes: { brand: templateAttr.string() },
    });

    const { product } = await createProduct.execute({
      name: 'Test Product',
      code: 'PROD-001',
      status: 'ACTIVE',
      attributes: {},
      templateId: template.id.toString(),
    });

    await expect(() =>
      createVariant.execute({
        productId: product.id.toString(),
        sku: 'SKU-001',
        name: 'A'.repeat(257),
        price: 100,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not allow creating variant with negative price', async () => {
    const { template } = await createTemplate.execute({
      name: 'Test Template',
      productAttributes: { brand: templateAttr.string() },
    });

    const { product } = await createProduct.execute({
      name: 'Test Product',
      code: 'PROD-001',
      status: 'ACTIVE',
      attributes: {},
      templateId: template.id.toString(),
    });

    await expect(() =>
      createVariant.execute({
        productId: product.id.toString(),
        sku: 'SKU-001',
        name: 'Test Variant',
        price: -10,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not allow creating variant with profit margin below 0', async () => {
    const { template } = await createTemplate.execute({
      name: 'Test Template',
      productAttributes: { brand: templateAttr.string() },
    });

    const { product } = await createProduct.execute({
      name: 'Test Product',
      code: 'PROD-001',
      status: 'ACTIVE',
      attributes: {},
      templateId: template.id.toString(),
    });

    await expect(() =>
      createVariant.execute({
        productId: product.id.toString(),
        sku: 'SKU-001',
        name: 'Test Variant',
        price: 100,
        profitMargin: -5,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not allow creating variant with profit margin above 100', async () => {
    const { template } = await createTemplate.execute({
      name: 'Test Template',
      productAttributes: { brand: templateAttr.string() },
    });

    const { product } = await createProduct.execute({
      name: 'Test Product',
      code: 'PROD-001',
      status: 'ACTIVE',
      attributes: {},
      templateId: template.id.toString(),
    });

    await expect(() =>
      createVariant.execute({
        productId: product.id.toString(),
        sku: 'SKU-001',
        name: 'Test Variant',
        price: 100,
        profitMargin: 150,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not allow creating variant with negative cost price', async () => {
    const { template } = await createTemplate.execute({
      name: 'Test Template',
      productAttributes: { brand: templateAttr.string() },
    });

    const { product } = await createProduct.execute({
      name: 'Test Product',
      code: 'PROD-001',
      status: 'ACTIVE',
      attributes: {},
      templateId: template.id.toString(),
    });

    await expect(() =>
      createVariant.execute({
        productId: product.id.toString(),
        sku: 'SKU-001',
        name: 'Test Variant',
        price: 100,
        costPrice: -50,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not allow creating variant with minStock > maxStock', async () => {
    await expect(() =>
      createVariant.execute({
        productId: new UniqueEntityID().toString(),
        sku: 'SKU-001',
        name: 'Test Variant',
        price: 100,
        minStock: 100,
        maxStock: 50,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not allow creating variant with negative stock values', async () => {
    await expect(() =>
      createVariant.execute({
        productId: new UniqueEntityID().toString(),
        sku: 'SKU-001',
        name: 'Test Variant',
        price: 100,
        minStock: -10,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not allow creating variant for non-existent product', async () => {
    await expect(() =>
      createVariant.execute({
        productId: new UniqueEntityID().toString(),
        sku: 'SKU-001',
        name: 'Test Variant',
        price: 100,
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should not allow duplicate SKU', async () => {
    const { template } = await createTemplate.execute({
      name: 'Test Template',
      productAttributes: { brand: templateAttr.string() },
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

    await expect(() =>
      createVariant.execute({
        productId: product.id.toString(),
        sku: 'SKU-001',
        name: 'Variant 2',
        price: 200,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not allow duplicate barcode', async () => {
    const { template } = await createTemplate.execute({
      name: 'Test Template',
      productAttributes: { brand: templateAttr.string() },
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
      barcode: '123456789012',
    });

    await expect(() =>
      createVariant.execute({
        productId: product.id.toString(),
        sku: 'SKU-002',
        name: 'Variant 2',
        price: 200,
        barcode: '123456789012',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not allow duplicate EAN code', async () => {
    const { template } = await createTemplate.execute({
      name: 'Test Template',
      productAttributes: { brand: templateAttr.string() },
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
      eanCode: '1234567890123',
    });

    await expect(() =>
      createVariant.execute({
        productId: product.id.toString(),
        sku: 'SKU-002',
        name: 'Variant 2',
        price: 200,
        eanCode: '1234567890123',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not allow duplicate UPC code', async () => {
    const { template } = await createTemplate.execute({
      name: 'Test Template',
      productAttributes: { brand: templateAttr.string() },
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
      upcCode: '123456789012',
    });

    await expect(() =>
      createVariant.execute({
        productId: product.id.toString(),
        sku: 'SKU-002',
        name: 'Variant 2',
        price: 200,
        upcCode: '123456789012',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not allow invalid variant attributes not in template', async () => {
    const { template } = await createTemplate.execute({
      name: 'Electronics Template',
      productAttributes: { brand: templateAttr.string() },
      variantAttributes: { color: templateAttr.string(), storage: templateAttr.string() },
    });

    const { product } = await createProduct.execute({
      name: 'Smartphone',
      code: 'PHONE-001',
      status: 'ACTIVE',
      attributes: { brand: 'Samsung' },
      templateId: template.id.toString(),
    });

    await expect(() =>
      createVariant.execute({
        productId: product.id.toString(),
        sku: 'PHONE-001-BLK',
        name: 'Smartphone Black',
        price: 999.99,
        attributes: { color: 'Black', invalidKey: 'InvalidValue' },
      }),
    ).rejects.toThrow(BadRequestError);
  });
});
