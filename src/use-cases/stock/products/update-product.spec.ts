import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryCategoriesRepository } from '@/repositories/stock/in-memory/in-memory-categories-repository';
import { InMemoryManufacturersRepository } from '@/repositories/stock/in-memory/in-memory-manufacturers-repository';
import { InMemoryProductsRepository } from '@/repositories/stock/in-memory/in-memory-products-repository';
import { InMemorySuppliersRepository } from '@/repositories/stock/in-memory/in-memory-suppliers-repository';
import { InMemoryTemplatesRepository } from '@/repositories/stock/in-memory/in-memory-templates-repository';
import type { CareCatalogProvider } from '@/services/care';
import { templateAttr } from '@/utils/tests/factories/stock/make-template';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateManufacturerUseCase } from '../manufacturers/create-manufacturer';
import { CreateSupplierUseCase } from '../suppliers/create-supplier';
import { CreateTemplateUseCase } from '../templates/create-template';
import { CreateProductUseCase } from './create-product';
import { UpdateProductUseCase } from './update-product';

let productsRepository: InMemoryProductsRepository;
let templatesRepository: InMemoryTemplatesRepository;
let suppliersRepository: InMemorySuppliersRepository;
let manufacturersRepository: InMemoryManufacturersRepository;
let categoriesRepository: InMemoryCategoriesRepository;
let sut: UpdateProductUseCase;
let createProduct: CreateProductUseCase;
let createTemplate: CreateTemplateUseCase;
let createSupplier: CreateSupplierUseCase;
let createManufacturer: CreateManufacturerUseCase;

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

describe('UpdateProductUseCase', () => {
  beforeEach(() => {
    productsRepository = new InMemoryProductsRepository();
    templatesRepository = new InMemoryTemplatesRepository();
    suppliersRepository = new InMemorySuppliersRepository();
    manufacturersRepository = new InMemoryManufacturersRepository();
    categoriesRepository = new InMemoryCategoriesRepository();

    sut = new UpdateProductUseCase(
      productsRepository,
      templatesRepository,
      suppliersRepository,
      manufacturersRepository,
      categoriesRepository,
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
    createSupplier = new CreateSupplierUseCase(suppliersRepository);
    createManufacturer = new CreateManufacturerUseCase(manufacturersRepository);
  });

  it('should update a product', async () => {
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

    const result = await sut.execute({
      tenantId: TENANT_ID,
      id: created.product.id.toString(),
      name: 'Laptop Dell Inspiron',
      description: 'Updated description',
      status: 'ACTIVE',
    });

    expect(result.product.id.toString()).toBe(created.product.id.toString());
    expect(result.product.name).toBe('Laptop Dell Inspiron');
    expect(result.product.description).toBe('Updated description');
    expect(result.product.status.value).toBe('ACTIVE');
  });

  it('should update only provided fields', async () => {
    const template = await createTemplate.execute({
      tenantId: TENANT_ID,
      name: 'Electronics Template',
      productAttributes: { brand: templateAttr.string() },
    });

    const created = await createProduct.execute({
      tenantId: TENANT_ID,
      name: 'Laptop Dell',
      description: 'Original',
      templateId: template.template.id.toString(),
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      id: created.product.id.toString(),
      description: 'Updated',
    });

    expect(result.product.name).toBe('Laptop Dell');
    expect(result.product.slug).toBeDefined();
    expect(result.product.description).toBe('Updated');
  });

  it('should update product with supplier', async () => {
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

    const supplier = await createSupplier.execute({
      tenantId: TENANT_ID,
      name: 'Tech Supplies Co.',
      country: 'United States',
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      id: created.product.id.toString(),
      supplierId: supplier.supplier.id.toString(),
    });

    expect(result.product.supplierId?.toString()).toBe(
      supplier.supplier.id.toString(),
    );
  });

  it('should update product with manufacturer', async () => {
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

    const manufacturer = await createManufacturer.execute({
      tenantId: TENANT_ID,
      name: 'Dell Inc.',
      country: 'United States',
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      id: created.product.id.toString(),
      manufacturerId: manufacturer.manufacturer.manufacturerId.toString(),
    });

    expect(result.product.manufacturerId?.toString()).toBe(
      manufacturer.manufacturer.manufacturerId.toString(),
    );
  });

  it('should update product outOfLine field', async () => {
    const template = await createTemplate.execute({
      tenantId: TENANT_ID,
      name: 'Electronics Template',
      productAttributes: { brand: templateAttr.string() },
    });

    const created = await createProduct.execute({
      tenantId: TENANT_ID,
      name: 'Product OutOfLine Test',

      templateId: template.template.id.toString(),
    });

    expect(created.product.outOfLine).toBe(false);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      id: created.product.id.toString(),
      outOfLine: true,
    });

    expect(result.product.outOfLine).toBe(true);
  });

  it('should throw error if product not found', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        id: 'non-existent-id',
        name: 'Updated Name',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should not update with empty name', async () => {
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

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        id: created.product.id.toString(),
        name: '',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not update with duplicate name', async () => {
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

    const second = await createProduct.execute({
      tenantId: TENANT_ID,
      name: 'Mouse Logitech',

      templateId: template.template.id.toString(),
    });

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        id: second.product.id.toString(),
        name: 'Laptop Dell',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not update with non-existent supplier', async () => {
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

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        id: created.product.id.toString(),
        supplierId: 'non-existent-supplier-id',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should not update with non-existent manufacturer', async () => {
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

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        id: created.product.id.toString(),
        manufacturerId: 'non-existent-manufacturer-id',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should not update with invalid attributes', async () => {
    const template = await createTemplate.execute({
      tenantId: TENANT_ID,
      name: 'Electronics Template',
      productAttributes: {
        brand: templateAttr.string(),
        model: templateAttr.string(),
      },
    });

    const created = await createProduct.execute({
      tenantId: TENANT_ID,
      name: 'Laptop Dell',

      templateId: template.template.id.toString(),
      attributes: { brand: 'Dell' },
    });

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        id: created.product.id.toString(),
        attributes: {
          brand: 'HP',
          invalidAttribute: 'value',
        },
      }),
    ).rejects.toThrow(BadRequestError);
  });
});
