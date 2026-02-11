import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
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
import { DeleteProductUseCase } from './delete-product';
import { GetProductByIdUseCase } from './get-product-by-id';

let productsRepository: InMemoryProductsRepository;
let templatesRepository: InMemoryTemplatesRepository;
let suppliersRepository: InMemorySuppliersRepository;
let manufacturersRepository: InMemoryManufacturersRepository;
let categoriesRepository: InMemoryCategoriesRepository;
let sut: DeleteProductUseCase;
let createProduct: CreateProductUseCase;
let getProduct: GetProductByIdUseCase;
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

describe('DeleteProductUseCase', () => {
  beforeEach(() => {
    productsRepository = new InMemoryProductsRepository();
    templatesRepository = new InMemoryTemplatesRepository();
    suppliersRepository = new InMemorySuppliersRepository();
    manufacturersRepository = new InMemoryManufacturersRepository();
    categoriesRepository = new InMemoryCategoriesRepository();

    sut = new DeleteProductUseCase(productsRepository);
    createProduct = new CreateProductUseCase(
      productsRepository,
      templatesRepository,
      suppliersRepository,
      manufacturersRepository,
      categoriesRepository,
      mockCareCatalog,
    );
    getProduct = new GetProductByIdUseCase(productsRepository);
    createTemplate = new CreateTemplateUseCase(templatesRepository);
  });

  it('should delete a product', async () => {
    const template = await createTemplate.execute({
      tenantId: TENANT_ID,
      name: 'Electronics Template',
      productAttributes: { brand: templateAttr.string() },
    });

    const created = await createProduct.execute({
      tenantId: TENANT_ID,
      name: 'Laptop Dell',
      templateId: template.template.id.toString(),
    });

    await sut.execute({
      tenantId: TENANT_ID,
      id: created.product.id.toString(),
    });

    await expect(
      getProduct.execute({
        tenantId: TENANT_ID,
        id: created.product.id.toString(),
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should throw error if product not found', async () => {
    await expect(
      sut.execute({ tenantId: TENANT_ID, id: 'non-existent-id' }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
