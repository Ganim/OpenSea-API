import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryCategoriesRepository } from '@/repositories/stock/in-memory/in-memory-categories-repository';
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
import { BulkCreateVariantsUseCase } from './bulk-create-variants';

let variantsRepository: InMemoryVariantsRepository;
let productsRepository: InMemoryProductsRepository;
let templatesRepository: InMemoryTemplatesRepository;
let suppliersRepository: InMemorySuppliersRepository;
let manufacturersRepository: InMemoryManufacturersRepository;
let categoriesRepository: InMemoryCategoriesRepository;
let sut: BulkCreateVariantsUseCase;
let createProduct: CreateProductUseCase;
let createTemplate: CreateTemplateUseCase;
let createVariant: CreateVariantUseCase;

const TENANT_ID = 'tenant-1';

let templateId: string;
let productId: string;
let productFullCode: string;

describe('BulkCreateVariantsUseCase', () => {
  beforeEach(async () => {
    variantsRepository = new InMemoryVariantsRepository();
    productsRepository = new InMemoryProductsRepository();
    templatesRepository = new InMemoryTemplatesRepository();
    suppliersRepository = new InMemorySuppliersRepository();
    manufacturersRepository = new InMemoryManufacturersRepository();
    categoriesRepository = new InMemoryCategoriesRepository();

    sut = new BulkCreateVariantsUseCase(
      variantsRepository,
      productsRepository,
      templatesRepository,
    );

    createTemplate = new CreateTemplateUseCase(templatesRepository);
    createProduct = new CreateProductUseCase(
      productsRepository,
      templatesRepository,
      suppliersRepository,
      manufacturersRepository,
      categoriesRepository,
    );
    createVariant = new CreateVariantUseCase(
      variantsRepository,
      productsRepository,
      templatesRepository,
    );

    // Pre-create a template with variantAttributes
    const templateResult = await createTemplate.execute({
      tenantId: TENANT_ID,
      name: 'Electronics Template',
      productAttributes: { brand: templateAttr.string() },
      variantAttributes: {
        color: templateAttr.string(),
        storage: templateAttr.string(),
      },
    });

    templateId = templateResult.template.id.toString();

    // Pre-create a product linked to the template
    const productResult = await createProduct.execute({
      tenantId: TENANT_ID,
      name: 'Smartphone',
      status: 'ACTIVE',
      attributes: { brand: 'Samsung' },
      templateId,
    });

    productId = productResult.product.id.toString();
    productFullCode = productResult.product.fullCode;
  });

  it('should create multiple variants successfully', async () => {
    const result = await sut.execute({
      tenantId: TENANT_ID,
      variants: [
        { name: 'Black 64GB', productId, price: 799.99, attributes: { color: 'Black', storage: '64GB' } },
        { name: 'White 128GB', productId, price: 899.99, attributes: { color: 'White', storage: '128GB' } },
        { name: 'Blue 256GB', productId, price: 999.99, attributes: { color: 'Blue', storage: '256GB' } },
      ],
      options: { skipDuplicates: false },
    });

    expect(result.created).toHaveLength(3);
    expect(result.skipped).toHaveLength(0);
    expect(result.errors).toHaveLength(0);

    for (const variant of result.created) {
      expect(variant.fullCode).toEqual(expect.any(String));
      expect(variant.barcode).toBeDefined();
      expect(variant.eanCode).toBeDefined();
      expect(variant.upcCode).toBeDefined();
    }

    expect(result.created[0].name).toBe('Black 64GB');
    expect(result.created[1].name).toBe('White 128GB');
    expect(result.created[2].name).toBe('Blue 256GB');
  });

  it('should skip duplicate variants when skipDuplicates is true', async () => {
    // Pre-create a variant with a known name
    await createVariant.execute({
      tenantId: TENANT_ID,
      productId,
      name: 'Existing Variant',
      price: 100,
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      variants: [
        { name: 'Existing Variant', productId },
        { name: 'New Variant Alpha', productId },
      ],
      options: { skipDuplicates: true },
    });

    expect(result.created).toHaveLength(1);
    expect(result.created[0].name).toBe('New Variant Alpha');
    expect(result.skipped).toHaveLength(1);
    expect(result.skipped[0].name).toBe('Existing Variant');
    expect(result.skipped[0].reason).toEqual(expect.any(String));
    expect(result.errors).toHaveLength(0);
  });

  it('should error on duplicate variants when skipDuplicates is false', async () => {
    // Pre-create a variant with a known name
    await createVariant.execute({
      tenantId: TENANT_ID,
      productId,
      name: 'Existing Variant',
      price: 100,
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      variants: [
        { name: 'Existing Variant', productId },
        { name: 'New Variant Beta', productId },
      ],
      options: { skipDuplicates: false },
    });

    expect(result.created).toHaveLength(1);
    expect(result.created[0].name).toBe('New Variant Beta');
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].name).toBe('Existing Variant');
    expect(result.errors[0].message).toEqual(expect.any(String));
    expect(result.skipped).toHaveLength(0);
  });

  it('should error when name is empty', async () => {
    const result = await sut.execute({
      tenantId: TENANT_ID,
      variants: [{ name: '', productId }],
      options: { skipDuplicates: false },
    });

    expect(result.created).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].name).toBe('');
    expect(result.errors[0].message).toContain('Name');
  });

  it('should error when name exceeds 256 characters', async () => {
    const longName = 'A'.repeat(257);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      variants: [{ name: longName, productId }],
      options: { skipDuplicates: false },
    });

    expect(result.created).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].name).toBe(longName);
    expect(result.errors[0].message).toContain('256');
  });

  it('should error when product does not exist', async () => {
    const nonExistentProductId = new UniqueEntityID().toString();

    const result = await sut.execute({
      tenantId: TENANT_ID,
      variants: [{ name: 'Orphan Variant', productId: nonExistentProductId }],
      options: { skipDuplicates: false },
    });

    expect(result.created).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].name).toBe('Orphan Variant');
    expect(result.errors[0].message).toContain('Product not found');
  });

  it('should validate attributes against template variantAttributes', async () => {
    const result = await sut.execute({
      tenantId: TENANT_ID,
      variants: [
        {
          name: 'Invalid Attributes Variant',
          productId,
          price: 100,
          attributes: { color: 'Red', invalidKey: 'InvalidValue' },
        },
      ],
      options: { skipDuplicates: false },
    });

    expect(result.created).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].name).toBe('Invalid Attributes Variant');
  });

  it('should error when price is negative', async () => {
    const result = await sut.execute({
      tenantId: TENANT_ID,
      variants: [{ name: 'Negative Price Variant', productId, price: -10 }],
      options: { skipDuplicates: false },
    });

    expect(result.created).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].name).toBe('Negative Price Variant');
    expect(result.errors[0].message).toContain('Price');
  });

  it('should error when costPrice is negative', async () => {
    const result = await sut.execute({
      tenantId: TENANT_ID,
      variants: [
        { name: 'Negative Cost Variant', productId, price: 100, costPrice: -50 },
      ],
      options: { skipDuplicates: false },
    });

    expect(result.created).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].name).toBe('Negative Cost Variant');
    expect(result.errors[0].message).toContain('Cost price');
  });

  it('should error when profitMargin is out of range', async () => {
    const result = await sut.execute({
      tenantId: TENANT_ID,
      variants: [
        { name: 'High Margin Variant', productId, price: 100, profitMargin: 150 },
      ],
      options: { skipDuplicates: false },
    });

    expect(result.created).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].name).toBe('High Margin Variant');
    expect(result.errors[0].message).toContain('Profit margin');
  });

  it('should error when minStock > maxStock', async () => {
    const result = await sut.execute({
      tenantId: TENANT_ID,
      variants: [
        {
          name: 'Invalid Stock Variant',
          productId,
          price: 100,
          minStock: 100,
          maxStock: 50,
        },
      ],
      options: { skipDuplicates: false },
    });

    expect(result.created).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].name).toBe('Invalid Stock Variant');
    expect(result.errors[0].message).toContain('Min stock');
  });

  it('should generate correct sequential fullCode per product', async () => {
    const result = await sut.execute({
      tenantId: TENANT_ID,
      variants: [
        { name: 'Variant One', productId, price: 100 },
        { name: 'Variant Two', productId, price: 200 },
        { name: 'Variant Three', productId, price: 300 },
      ],
      options: { skipDuplicates: false },
    });

    expect(result.created).toHaveLength(3);

    expect(result.created[0].fullCode).toBe(`${productFullCode}.001`);
    expect(result.created[1].fullCode).toBe(`${productFullCode}.002`);
    expect(result.created[2].fullCode).toBe(`${productFullCode}.003`);
  });

  it('should handle variants across different products', async () => {
    // Create a second product
    const secondProductResult = await createProduct.execute({
      tenantId: TENANT_ID,
      name: 'Tablet',
      status: 'ACTIVE',
      attributes: { brand: 'Apple' },
      templateId,
    });

    const secondProductId = secondProductResult.product.id.toString();
    const secondProductFullCode = secondProductResult.product.fullCode;

    const result = await sut.execute({
      tenantId: TENANT_ID,
      variants: [
        { name: 'Phone Black', productId, price: 799 },
        { name: 'Tablet Silver', productId: secondProductId, price: 999 },
        { name: 'Phone White', productId, price: 899 },
        { name: 'Tablet Gold', productId: secondProductId, price: 1099 },
      ],
      options: { skipDuplicates: false },
    });

    expect(result.created).toHaveLength(4);
    expect(result.errors).toHaveLength(0);

    // First product variants: sequential .001 and .002
    const firstProductVariants = result.created.filter(
      (v) => v.productId.toString() === productId,
    );
    expect(firstProductVariants).toHaveLength(2);
    expect(firstProductVariants[0].fullCode).toBe(`${productFullCode}.001`);
    expect(firstProductVariants[1].fullCode).toBe(`${productFullCode}.002`);

    // Second product variants: independent sequential .001 and .002
    const secondProductVariants = result.created.filter(
      (v) => v.productId.toString() === secondProductId,
    );
    expect(secondProductVariants).toHaveLength(2);
    expect(secondProductVariants[0].fullCode).toBe(`${secondProductFullCode}.001`);
    expect(secondProductVariants[1].fullCode).toBe(`${secondProductFullCode}.002`);
  });

  it('should handle partial failure', async () => {
    const result = await sut.execute({
      tenantId: TENANT_ID,
      variants: [
        { name: 'Valid Variant Alpha', productId, price: 100 },
        { name: '', productId, price: 200 }, // invalid: empty name
        { name: 'Valid Variant Beta', productId, price: 300 },
      ],
      options: { skipDuplicates: false },
    });

    expect(result.created).toHaveLength(2);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].name).toBe('');
    expect(result.created[0].name).toBe('Valid Variant Alpha');
    expect(result.created[1].name).toBe('Valid Variant Beta');
  });

  it('should return empty results for empty input', async () => {
    const result = await sut.execute({
      tenantId: TENANT_ID,
      variants: [],
      options: { skipDuplicates: false },
    });

    expect(result.created).toHaveLength(0);
    expect(result.skipped).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });
});
