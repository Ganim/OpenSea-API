import { InMemoryCategoriesRepository } from '@/repositories/stock/in-memory/in-memory-categories-repository';
import { InMemoryManufacturersRepository } from '@/repositories/stock/in-memory/in-memory-manufacturers-repository';
import { InMemoryProductsRepository } from '@/repositories/stock/in-memory/in-memory-products-repository';
import { InMemorySuppliersRepository } from '@/repositories/stock/in-memory/in-memory-suppliers-repository';
import { InMemoryTemplatesRepository } from '@/repositories/stock/in-memory/in-memory-templates-repository';
import type { CareCatalogProvider } from '@/services/care';
import { templateAttr } from '@/utils/tests/factories/stock/make-template';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateTemplateUseCase } from '../templates/create-template';
import { CreateProductUseCase } from './create-product';
import { ListProductsUseCase } from './list-products';

let productsRepository: InMemoryProductsRepository;
let templatesRepository: InMemoryTemplatesRepository;
let suppliersRepository: InMemorySuppliersRepository;
let manufacturersRepository: InMemoryManufacturersRepository;
let categoriesRepository: InMemoryCategoriesRepository;
let sut: ListProductsUseCase;
let createProduct: CreateProductUseCase;
let createTemplate: CreateTemplateUseCase;

const TENANT_ID = 'tenant-1';

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

describe('ListProductsUseCase', () => {
  beforeEach(() => {
    productsRepository = new InMemoryProductsRepository();
    templatesRepository = new InMemoryTemplatesRepository();
    suppliersRepository = new InMemorySuppliersRepository();
    manufacturersRepository = new InMemoryManufacturersRepository();
    categoriesRepository = new InMemoryCategoriesRepository();

    sut = new ListProductsUseCase(productsRepository);
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

  it('should list all products', async () => {
    const template = await createTemplate.execute({
      tenantId: TENANT_ID,
      name: 'Electronics Template',
      productAttributes: { brand: templateAttr.string() },
    });

    await createProduct.execute({
      tenantId: TENANT_ID,
      name: 'Laptop Dell',
      templateId: template.template.id.toString(),
    });

    await createProduct.execute({
      tenantId: TENANT_ID,
      name: 'Mouse Logitech',
      templateId: template.template.id.toString(),
    });

    const result = await sut.execute({ tenantId: TENANT_ID });

    expect(result.products).toHaveLength(2);
    expect(result.products[0].name).toBe('Laptop Dell');
    expect(result.products[1].name).toBe('Mouse Logitech');
  });

  it('should return empty array when no products exist', async () => {
    const result = await sut.execute({ tenantId: TENANT_ID });

    expect(result.products).toHaveLength(0);
  });
});
