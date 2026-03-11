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
import { ListVariantsUseCase } from './list-variants';

let variantsRepository: InMemoryVariantsRepository;
let productsRepository: InMemoryProductsRepository;
let templatesRepository: InMemoryTemplatesRepository;
let suppliersRepository: InMemorySuppliersRepository;
let manufacturersRepository: InMemoryManufacturersRepository;
let categoriesRepository: InMemoryCategoriesRepository;
let listVariants: ListVariantsUseCase;
let createVariant: CreateVariantUseCase;
let createProduct: CreateProductUseCase;
let createTemplate: CreateTemplateUseCase;

describe('ListVariantsUseCase', () => {
  beforeEach(() => {
    variantsRepository = new InMemoryVariantsRepository();
    productsRepository = new InMemoryProductsRepository();
    templatesRepository = new InMemoryTemplatesRepository();
    suppliersRepository = new InMemorySuppliersRepository();
    manufacturersRepository = new InMemoryManufacturersRepository();
    categoriesRepository = new InMemoryCategoriesRepository();
    listVariants = new ListVariantsUseCase(variantsRepository);
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
    );
    createTemplate = new CreateTemplateUseCase(templatesRepository);
  });

  it('should be able to list all variants', async () => {
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

    await createVariant.execute({
      tenantId: 'tenant-1',
      productId: product.id.toString(),
      sku: 'SKU-002',
      name: 'Variant 2',
      price: 200,
    });

    const result = await listVariants.execute({ tenantId: 'tenant-1' });

    expect(result.variants).toHaveLength(2);
    expect(result.variants[0].name).toBe('Variant 1');
    expect(result.variants[1].name).toBe('Variant 2');
    expect(result.meta).toEqual({
      total: 2,
      page: 1,
      limit: 20,
      pages: 1,
    });
  });

  it('should return empty array when there are no variants', async () => {
    const result = await listVariants.execute({ tenantId: 'tenant-1' });

    expect(result.variants).toHaveLength(0);
    expect(result.meta.total).toBe(0);
  });
});
