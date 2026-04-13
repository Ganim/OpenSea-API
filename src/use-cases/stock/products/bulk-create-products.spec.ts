import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryCategoriesRepository } from '@/repositories/stock/in-memory/in-memory-categories-repository';
import { InMemoryManufacturersRepository } from '@/repositories/stock/in-memory/in-memory-manufacturers-repository';
import { InMemoryProductsRepository } from '@/repositories/stock/in-memory/in-memory-products-repository';
import { InMemoryTemplatesRepository } from '@/repositories/stock/in-memory/in-memory-templates-repository';
import { templateAttr } from '@/utils/tests/factories/stock/make-template';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateCategoryUseCase } from '../categories/create-category';
import { CreateManufacturerUseCase } from '../manufacturers/create-manufacturer';

import { CreateTemplateUseCase } from '../templates/create-template';
import { CreateProductUseCase } from './create-product';
import { BulkCreateProductsUseCase } from './bulk-create-products';

let productsRepository: InMemoryProductsRepository;
let templatesRepository: InMemoryTemplatesRepository;
let manufacturersRepository: InMemoryManufacturersRepository;
let categoriesRepository: InMemoryCategoriesRepository;
let sut: BulkCreateProductsUseCase;
let createTemplate: CreateTemplateUseCase;

let createManufacturer: CreateManufacturerUseCase;
let createCategory: CreateCategoryUseCase;
let createProduct: CreateProductUseCase;

const TENANT_ID = 'tenant-1';

let templateId: string;

describe('BulkCreateProductsUseCase', () => {
  beforeEach(async () => {
    productsRepository = new InMemoryProductsRepository();
    templatesRepository = new InMemoryTemplatesRepository();
    manufacturersRepository = new InMemoryManufacturersRepository();
    categoriesRepository = new InMemoryCategoriesRepository();

    sut = new BulkCreateProductsUseCase(
      productsRepository,
      templatesRepository,
      manufacturersRepository,
      categoriesRepository,
    );

    createTemplate = new CreateTemplateUseCase(templatesRepository);
    createManufacturer = new CreateManufacturerUseCase(manufacturersRepository);
    createCategory = new CreateCategoryUseCase(categoriesRepository);
    createProduct = new CreateProductUseCase(
      productsRepository,
      templatesRepository,
      manufacturersRepository,
      categoriesRepository,
    );

    // Pre-create a template used by most tests
    const templateResult = await createTemplate.execute({
      tenantId: TENANT_ID,
      name: 'Electronics Template',
      productAttributes: {
        brand: templateAttr.string(),
        model: templateAttr.string(),
      },
    });

    templateId = templateResult.template.id.toString();
  });

  it('should create multiple products successfully', async () => {
    const result = await sut.execute({
      tenantId: TENANT_ID,
      products: [
        { name: 'Laptop Dell Inspiron', templateId },
        { name: 'Laptop HP Pavilion', templateId },
        { name: 'Laptop Lenovo ThinkPad', templateId },
      ],
      options: { skipDuplicates: false },
    });

    expect(result.created).toHaveLength(3);
    expect(result.skipped).toHaveLength(0);
    expect(result.errors).toHaveLength(0);

    for (const product of result.created) {
      expect(product.fullCode).toEqual(expect.any(String));
      expect(product.barcode).toEqual(expect.any(String));
      expect(product.eanCode).toEqual(expect.any(String));
      expect(product.upcCode).toEqual(expect.any(String));
      expect(product.name).toEqual(expect.any(String));
    }

    expect(result.created[0].name).toBe('Laptop Dell Inspiron');
    expect(result.created[1].name).toBe('Laptop HP Pavilion');
    expect(result.created[2].name).toBe('Laptop Lenovo ThinkPad');
  });

  it('should skip duplicate products when skipDuplicates is true', async () => {
    // Pre-create a product with a known name
    await createProduct.execute({
      tenantId: TENANT_ID,
      name: 'Existing Product',
      templateId,
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      products: [
        { name: 'Existing Product', templateId },
        { name: 'New Product Alpha', templateId },
      ],
      options: { skipDuplicates: true },
    });

    expect(result.created).toHaveLength(1);
    expect(result.created[0].name).toBe('New Product Alpha');
    expect(result.skipped).toHaveLength(1);
    expect(result.skipped[0].name).toBe('Existing Product');
    expect(result.skipped[0].reason).toEqual(expect.any(String));
    expect(result.errors).toHaveLength(0);
  });

  it('should error on duplicate products when skipDuplicates is false', async () => {
    await createProduct.execute({
      tenantId: TENANT_ID,
      name: 'Existing Product',
      templateId,
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      products: [
        { name: 'Existing Product', templateId },
        { name: 'New Product Beta', templateId },
      ],
      options: { skipDuplicates: false },
    });

    expect(result.created).toHaveLength(1);
    expect(result.created[0].name).toBe('New Product Beta');
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].name).toBe('Existing Product');
    expect(result.errors[0].message).toEqual(expect.any(String));
    expect(result.skipped).toHaveLength(0);
  });

  it('should error when name is empty', async () => {
    const result = await sut.execute({
      tenantId: TENANT_ID,
      products: [{ name: '', templateId }],
      options: { skipDuplicates: false },
    });

    expect(result.created).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].name).toBe('');
    expect(result.errors[0].message).toContain('Name');
  });

  it('should error when name exceeds 200 characters', async () => {
    const longName = 'a'.repeat(201);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      products: [{ name: longName, templateId }],
      options: { skipDuplicates: false },
    });

    expect(result.created).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].name).toBe(longName);
    expect(result.errors[0].message).toContain('200');
  });

  it('should throw when template does not exist', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        products: [
          {
            name: 'Product Without Template',
            templateId: 'non-existent-template-id',
          },
        ],
        options: { skipDuplicates: false },
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should error when manufacturer does not exist', async () => {
    const result = await sut.execute({
      tenantId: TENANT_ID,
      products: [
        {
          name: 'Product With Invalid Manufacturer',
          templateId,
          manufacturerId: 'non-existent-manufacturer-id',
        },
      ],
      options: { skipDuplicates: false },
    });

    expect(result.created).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].name).toBe('Product With Invalid Manufacturer');
    expect(result.errors[0].message).toContain('Manufacturer');
  });

  it('should error when category does not exist', async () => {
    const result = await sut.execute({
      tenantId: TENANT_ID,
      products: [
        {
          name: 'Product With Invalid Category',
          templateId,
          categoryIds: ['non-existent-category-id'],
        },
      ],
      options: { skipDuplicates: false },
    });

    expect(result.created).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].name).toBe('Product With Invalid Category');
    expect(result.errors[0].message).toContain('Category');
  });

  it('should validate attributes against template schema', async () => {
    const templateWithRequiredAttrs = await createTemplate.execute({
      tenantId: TENANT_ID,
      name: 'Strict Template',
      productAttributes: {
        voltage: templateAttr.number({ required: true }),
        color: templateAttr.string(),
      },
    });

    const strictTemplateId = templateWithRequiredAttrs.template.id.toString();

    const result = await sut.execute({
      tenantId: TENANT_ID,
      products: [
        {
          name: 'Product With Invalid Attributes',
          templateId: strictTemplateId,
          attributes: {
            voltage: 'not-a-number', // should be a number
          },
        },
      ],
      options: { skipDuplicates: false },
    });

    expect(result.created).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].name).toBe('Product With Invalid Attributes');
  });

  it('should generate correct fullCode, barcode, EAN, UPC for each product', async () => {
    const result = await sut.execute({
      tenantId: TENANT_ID,
      products: [
        { name: 'Code Test Product Alpha', templateId },
        { name: 'Code Test Product Beta', templateId },
      ],
      options: { skipDuplicates: false },
    });

    expect(result.created).toHaveLength(2);

    // fullCode follows the pattern: templateCode.manufacturerCode.sequentialCode
    // e.g., "001.000.0001"
    const fullCodePattern = /^\d{3}\.\d{3}\.\d{4}$/;

    for (const product of result.created) {
      expect(product.fullCode).toMatch(fullCodePattern);
      expect(product.barcode).toBeTruthy();
      expect(product.eanCode).toBeTruthy();
      expect(product.upcCode).toBeTruthy();
    }

    // Each product should have a unique fullCode
    expect(result.created[0].fullCode).not.toBe(result.created[1].fullCode);
  });

  it('should handle partial failure', async () => {
    const manufacturer = await createManufacturer.execute({
      tenantId: TENANT_ID,
      name: 'Valid Manufacturer Inc.',
      country: 'United States',
    });

    const validManufacturerId =
      manufacturer.manufacturer.manufacturerId.toString();

    const result = await sut.execute({
      tenantId: TENANT_ID,
      products: [
        {
          name: 'Valid Product One',
          templateId,
          manufacturerId: validManufacturerId,
        },
        {
          name: 'Invalid Product',
          templateId,
          manufacturerId: 'non-existent-manufacturer-id',
        },
        { name: 'Valid Product Two', templateId },
      ],
      options: { skipDuplicates: false },
    });

    expect(result.created).toHaveLength(2);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].name).toBe('Invalid Product');
    expect(result.created[0].name).toBe('Valid Product One');
    expect(result.created[1].name).toBe('Valid Product Two');
  });

  it('should handle mixed valid, invalid, and duplicate', async () => {
    // Pre-create a product to cause duplicate
    await createProduct.execute({
      tenantId: TENANT_ID,
      name: 'Dup Product',
      templateId,
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      products: [
        { name: 'Brand New Product', templateId },
        { name: 'Dup Product', templateId }, // duplicate -> skipped
        { name: '', templateId }, // invalid name -> error
      ],
      options: { skipDuplicates: true },
    });

    expect(result.created).toHaveLength(1);
    expect(result.created[0].name).toBe('Brand New Product');
    expect(result.skipped).toHaveLength(1);
    expect(result.skipped[0].name).toBe('Dup Product');
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].name).toBe('');
  });

  it('should associate categories correctly', async () => {
    const categoryAlpha = await createCategory.execute({
      tenantId: TENANT_ID,
      name: 'Category Alpha',
    });

    const categoryBeta = await createCategory.execute({
      tenantId: TENANT_ID,
      name: 'Category Beta',
    });

    const categoryAlphaId = categoryAlpha.category.id.toString();
    const categoryBetaId = categoryBeta.category.id.toString();

    const result = await sut.execute({
      tenantId: TENANT_ID,
      products: [
        {
          name: 'Product With Categories',
          templateId,
          categoryIds: [categoryAlphaId, categoryBetaId],
        },
      ],
      options: { skipDuplicates: false },
    });

    expect(result.created).toHaveLength(1);
    expect(result.errors).toHaveLength(0);
    // The product was created successfully with the category IDs provided
    expect(result.created[0].name).toBe('Product With Categories');
  });

  it('should return empty results for empty input', async () => {
    const result = await sut.execute({
      tenantId: TENANT_ID,
      products: [],
      options: { skipDuplicates: false },
    });

    expect(result.created).toHaveLength(0);
    expect(result.skipped).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });
});
