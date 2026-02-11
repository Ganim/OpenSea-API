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

let productsRepository: InMemoryProductsRepository;
let templatesRepository: InMemoryTemplatesRepository;
let suppliersRepository: InMemorySuppliersRepository;
let manufacturersRepository: InMemoryManufacturersRepository;
let categoriesRepository: InMemoryCategoriesRepository;
let sut: CreateProductUseCase;
let createTemplate: CreateTemplateUseCase;
let createSupplier: CreateSupplierUseCase;
let createManufacturer: CreateManufacturerUseCase;

const TENANT_ID = 'tenant-1';

const mockCareCatalog = {
  validateIds: (ids: string[]) => ids.filter((id) => !id.startsWith('WASH') && !id.startsWith('IRON') && !id.startsWith('DRY') && !id.startsWith('BLEACH') && !id.startsWith('DO_NOT')),
  exists: (id: string) => id.startsWith('WASH') || id.startsWith('IRON') || id.startsWith('DRY') || id.startsWith('BLEACH') || id.startsWith('DO_NOT'),
} as unknown as CareCatalogProvider;

describe('CreateProductUseCase', () => {
  beforeEach(() => {
    productsRepository = new InMemoryProductsRepository();
    templatesRepository = new InMemoryTemplatesRepository();
    suppliersRepository = new InMemorySuppliersRepository();
    manufacturersRepository = new InMemoryManufacturersRepository();
    categoriesRepository = new InMemoryCategoriesRepository();

    sut = new CreateProductUseCase(
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

  it('should create a product', async () => {
    const template = await createTemplate.execute({
      tenantId: TENANT_ID,
      name: 'Electronics Template',
      productAttributes: {
        brand: templateAttr.string(),
        model: templateAttr.string(),
        warranty: templateAttr.number({ unitOfMeasure: 'months' }),
      },
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      name: 'Laptop Dell Inspiron',
      description: 'High performance laptop',
      status: 'ACTIVE',
      templateId: template.template.id.toString(),
      attributes: {
        brand: 'Dell',
        model: 'Inspiron 15',
        warranty: 12,
      },
    });

    // Verifica os campos básicos
    expect(result.product.name).toBe('Laptop Dell Inspiron');
    expect(result.product.description).toBe('High performance laptop');
    expect(result.product.id).toBeDefined();
    expect(result.product.slug).toBeDefined();
    expect(result.product.fullCode).toEqual(expect.any(String));
    expect(result.product.barcode).toEqual(expect.any(String));
    expect(result.product.eanCode).toEqual(expect.any(String));
    expect(result.product.upcCode).toEqual(expect.any(String));
    expect(result.product.status).toBeDefined();
    expect(result.product.templateId).toBeDefined();
  });

  it('should create a product with supplier', async () => {
    const template = await createTemplate.execute({
      tenantId: TENANT_ID,
      name: 'Electronics Template',
      productAttributes: { brand: templateAttr.string() },
    });

    const supplier = await createSupplier.execute({
      tenantId: TENANT_ID,
      name: 'Tech Supplies Co.',
      country: 'United States',
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      name: 'Laptop Dell',
      templateId: template.template.id.toString(),
      supplierId: supplier.supplier.id.toString(),
    });

    expect(result.product.supplierId?.toString()).toBe(
      supplier.supplier.id.toString(),
    );
  });

  it('should create a product with manufacturer', async () => {
    const template = await createTemplate.execute({
      tenantId: TENANT_ID,
      name: 'Electronics Template',
      productAttributes: { brand: templateAttr.string() },
    });

    const manufacturer = await createManufacturer.execute({
      tenantId: TENANT_ID,
      name: 'Dell Inc.',
      country: 'United States',
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      name: 'Laptop Dell',
      templateId: template.template.id.toString(),
      manufacturerId: manufacturer.manufacturer.manufacturerId.toString(),
    });

    expect(result.product.manufacturerId?.toString()).toBe(
      manufacturer.manufacturer.manufacturerId.toString(),
    );
  });

  it('should create a product with default ACTIVE status', async () => {
    const template = await createTemplate.execute({
      tenantId: TENANT_ID,
      name: 'Simple Template',
      productAttributes: { category: templateAttr.string() },
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      name: 'Test Product',
      templateId: template.template.id.toString(),
    });

    expect(result.product.status.value).toBe('ACTIVE');
  });

  it('should create a product with outOfLine false by default', async () => {
    const template = await createTemplate.execute({
      tenantId: TENANT_ID,
      name: 'Simple Template',
      productAttributes: { category: templateAttr.string() },
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      name: 'Test Product OutOfLine',
      templateId: template.template.id.toString(),
    });

    expect(result.product.outOfLine).toBe(false);
  });

  it('should create a product with outOfLine true', async () => {
    const template = await createTemplate.execute({
      tenantId: TENANT_ID,
      name: 'Simple Template',
      productAttributes: { category: templateAttr.string() },
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      name: 'Test Product OutOfLine True',
      templateId: template.template.id.toString(),
      outOfLine: true,
    });

    expect(result.product.outOfLine).toBe(true);
  });

  it('should create a product without optional fields', async () => {
    const template = await createTemplate.execute({
      tenantId: TENANT_ID,
      name: 'Simple Template',
      productAttributes: { category: templateAttr.string() },
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      name: 'Simple Product',
      templateId: template.template.id.toString(),
    });

    expect(result.product.name).toBe('Simple Product');
    expect(result.product.description).toBeUndefined();
    expect(result.product.supplierId).toBeUndefined();
    expect(result.product.manufacturerId).toBeUndefined();
  });

  it('should not create a product with empty name', async () => {
    const template = await createTemplate.execute({
      tenantId: TENANT_ID,
      name: 'Simple Template',
      productAttributes: { category: templateAttr.string() },
    });

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        name: '',
        templateId: template.template.id.toString(),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not create a product with name longer than 200 characters', async () => {
    const template = await createTemplate.execute({
      tenantId: TENANT_ID,
      name: 'Simple Template',
      productAttributes: { category: templateAttr.string() },
    });

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        name: 'a'.repeat(201),
        templateId: template.template.id.toString(),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not create a product with duplicate name', async () => {
    const template = await createTemplate.execute({
      tenantId: TENANT_ID,
      name: 'Simple Template',
      productAttributes: { category: templateAttr.string() },
    });

    await sut.execute({
      tenantId: TENANT_ID,
      name: 'Laptop Dell',
      templateId: template.template.id.toString(),
    });

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        name: 'Laptop Dell',
        templateId: template.template.id.toString(),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not create a product with invalid status', async () => {
    const template = await createTemplate.execute({
      tenantId: TENANT_ID,
      name: 'Simple Template',
      productAttributes: { category: templateAttr.string() },
    });

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        name: 'Test Product',
        status: 'INVALID_STATUS',
        templateId: template.template.id.toString(),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  // unitOfMeasure foi movido para Template - teste removido

  it('should not create a product with non-existent template', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        name: 'Test Product',
        templateId: 'non-existent-template-id',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should not create a product with non-existent supplier', async () => {
    const template = await createTemplate.execute({
      tenantId: TENANT_ID,
      name: 'Simple Template',
      productAttributes: { category: templateAttr.string() },
    });

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        name: 'Test Product',
        templateId: template.template.id.toString(),
        supplierId: 'non-existent-supplier-id',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should not create a product with non-existent manufacturer', async () => {
    const template = await createTemplate.execute({
      tenantId: TENANT_ID,
      name: 'Simple Template',
      productAttributes: { category: templateAttr.string() },
    });

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        name: 'Test Product',
        templateId: template.template.id.toString(),
        manufacturerId: 'non-existent-manufacturer-id',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should not create a product with invalid attributes', async () => {
    const template = await createTemplate.execute({
      tenantId: TENANT_ID,
      name: 'Electronics Template',
      productAttributes: {
        brand: templateAttr.string(),
        model: templateAttr.string(),
      },
    });

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        name: 'Test Product',
        templateId: template.template.id.toString(),
        attributes: {
          brand: 'Dell',
          invalidAttribute: 'value', // Não está no template
        },
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should validate required attributes', async () => {
    const template = await createTemplate.execute({
      tenantId: TENANT_ID,
      name: 'Electronics Template',
      productAttributes: {
        brand: templateAttr.string({ required: true }),
        model: templateAttr.string(),
      },
    });

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        name: 'Test Product',
        templateId: template.template.id.toString(),
        attributes: {
          model: 'X123', // Missing required 'brand'
        },
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should validate attribute types', async () => {
    const template = await createTemplate.execute({
      tenantId: TENANT_ID,
      name: 'Electronics Template',
      productAttributes: {
        warranty: templateAttr.number({ unitOfMeasure: 'months' }),
      },
    });

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        name: 'Test Product',
        templateId: template.template.id.toString(),
        attributes: {
          warranty: 'invalid-number', // Should be a number
        },
      }),
    ).rejects.toThrow(BadRequestError);
  });
});
