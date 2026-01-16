import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryManufacturersRepository } from '@/repositories/stock/in-memory/in-memory-manufacturers-repository';
import { InMemoryProductsRepository } from '@/repositories/stock/in-memory/in-memory-products-repository';
import { InMemorySuppliersRepository } from '@/repositories/stock/in-memory/in-memory-suppliers-repository';
import { InMemoryTemplatesRepository } from '@/repositories/stock/in-memory/in-memory-templates-repository';
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
let sut: CreateProductUseCase;
let createTemplate: CreateTemplateUseCase;
let createSupplier: CreateSupplierUseCase;
let createManufacturer: CreateManufacturerUseCase;

describe('CreateProductUseCase', () => {
  beforeEach(() => {
    productsRepository = new InMemoryProductsRepository();
    templatesRepository = new InMemoryTemplatesRepository();
    suppliersRepository = new InMemorySuppliersRepository();
    manufacturersRepository = new InMemoryManufacturersRepository();

    sut = new CreateProductUseCase(
      productsRepository,
      templatesRepository,
      suppliersRepository,
      manufacturersRepository,
    );

    createTemplate = new CreateTemplateUseCase(templatesRepository);
    createSupplier = new CreateSupplierUseCase(suppliersRepository);
    createManufacturer = new CreateManufacturerUseCase(manufacturersRepository);
  });

  it('should create a product', async () => {
    const template = await createTemplate.execute({
      name: 'Electronics Template',
      productAttributes: {
        brand: templateAttr.string(),
        model: templateAttr.string(),
        warranty: templateAttr.number({ unitOfMeasure: 'months' }),
      },
    });

    const result = await sut.execute({
      name: 'Laptop Dell Inspiron',
      code: 'LAPTOP-001',
      description: 'High performance laptop',
      status: 'ACTIVE',
      templateId: template.template.id.toString(),
      attributes: {
        brand: 'Dell',
        model: 'Inspiron 15',
        warranty: 12,
      },
    });

    expect(result.product).toEqual(
      expect.objectContaining({
        id: expect.any(Object), // UniqueEntityID
        name: 'Laptop Dell Inspiron',
        code: 'LAPTOP-001',
        description: 'High performance laptop',
        status: expect.any(Object), // ProductStatus
        templateId: expect.any(Object), // UniqueEntityID
        attributes: {
          brand: 'Dell',
          model: 'Inspiron 15',
          warranty: 12,
        },
      }),
    );
  });

  it('should create a product with supplier', async () => {
    const template = await createTemplate.execute({
      name: 'Electronics Template',
      productAttributes: { brand: templateAttr.string() },
    });

    const supplier = await createSupplier.execute({
      name: 'Tech Supplies Co.',
      country: 'United States',
    });

    const result = await sut.execute({
      name: 'Laptop Dell',
      code: 'LAPTOP-001',
      templateId: template.template.id.toString(),
      supplierId: supplier.supplier.id.toString(),
    });

    expect(result.product.supplierId?.toString()).toBe(
      supplier.supplier.id.toString(),
    );
  });

  it('should create a product with manufacturer', async () => {
    const template = await createTemplate.execute({
      name: 'Electronics Template',
      productAttributes: { brand: templateAttr.string() },
    });

    const manufacturer = await createManufacturer.execute({
      name: 'Dell Inc.',
      country: 'United States',
    });

    const result = await sut.execute({
      name: 'Laptop Dell',
      code: 'LAPTOP-001',
      templateId: template.template.id.toString(),
      manufacturerId: manufacturer.manufacturer.manufacturerId.toString(),
    });

    expect(result.product.manufacturerId?.toString()).toBe(
      manufacturer.manufacturer.manufacturerId.toString(),
    );
  });

  it('should create a product with default ACTIVE status', async () => {
    const template = await createTemplate.execute({
      name: 'Simple Template',
      productAttributes: { category: templateAttr.string() },
    });

    const result = await sut.execute({
      name: 'Test Product',
      code: 'TEST-001',
      templateId: template.template.id.toString(),
    });

    expect(result.product.status.value).toBe('ACTIVE');
  });

  it('should create a product without optional fields', async () => {
    const template = await createTemplate.execute({
      name: 'Simple Template',
      productAttributes: { category: templateAttr.string() },
    });

    const result = await sut.execute({
      name: 'Simple Product',
      code: 'SIMPLE-001',
      templateId: template.template.id.toString(),
    });

    expect(result.product.name).toBe('Simple Product');
    expect(result.product.description).toBeUndefined();
    expect(result.product.supplierId).toBeUndefined();
    expect(result.product.manufacturerId).toBeUndefined();
  });

  it('should not create a product with empty name', async () => {
    const template = await createTemplate.execute({
      name: 'Simple Template',
      productAttributes: { category: templateAttr.string() },
    });

    await expect(
      sut.execute({
        name: '',
        code: 'TEST-001',
        templateId: template.template.id.toString(),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not create a product with name longer than 200 characters', async () => {
    const template = await createTemplate.execute({
      name: 'Simple Template',
      productAttributes: { category: templateAttr.string() },
    });

    await expect(
      sut.execute({
        name: 'a'.repeat(201),
        code: 'TEST-001',
        templateId: template.template.id.toString(),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should create a product without code (optional)', async () => {
    const template = await createTemplate.execute({
      name: 'Simple Template',
      productAttributes: { category: templateAttr.string() },
    });

    const result = await sut.execute({
      name: 'Product Without Code',
      templateId: template.template.id.toString(),
    });

    expect(result.product.name).toBe('Product Without Code');
    expect(result.product.code).toBeUndefined();
  });

  it('should not create a product with code longer than 100 characters', async () => {
    const template = await createTemplate.execute({
      name: 'Simple Template',
      productAttributes: { category: templateAttr.string() },
    });

    await expect(
      sut.execute({
        name: 'Test Product',
        code: 'a'.repeat(101),
        templateId: template.template.id.toString(),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not create a product with duplicate name', async () => {
    const template = await createTemplate.execute({
      name: 'Simple Template',
      productAttributes: { category: templateAttr.string() },
    });

    await sut.execute({
      name: 'Laptop Dell',
      code: 'LAPTOP-001',
      templateId: template.template.id.toString(),
    });

    await expect(
      sut.execute({
        name: 'Laptop Dell',
        code: 'LAPTOP-002',
        templateId: template.template.id.toString(),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not create a product with invalid status', async () => {
    const template = await createTemplate.execute({
      name: 'Simple Template',
      productAttributes: { category: templateAttr.string() },
    });

    await expect(
      sut.execute({
        name: 'Test Product',
        code: 'TEST-001',
        status: 'INVALID_STATUS',
        templateId: template.template.id.toString(),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  // unitOfMeasure foi movido para Template - teste removido

  it('should not create a product with non-existent template', async () => {
    await expect(
      sut.execute({
        name: 'Test Product',
        code: 'TEST-001',
        templateId: 'non-existent-template-id',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should not create a product with non-existent supplier', async () => {
    const template = await createTemplate.execute({
      name: 'Simple Template',
      productAttributes: { category: templateAttr.string() },
    });

    await expect(
      sut.execute({
        name: 'Test Product',
        code: 'TEST-001',
        templateId: template.template.id.toString(),
        supplierId: 'non-existent-supplier-id',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should not create a product with non-existent manufacturer', async () => {
    const template = await createTemplate.execute({
      name: 'Simple Template',
      productAttributes: { category: templateAttr.string() },
    });

    await expect(
      sut.execute({
        name: 'Test Product',
        code: 'TEST-001',
        templateId: template.template.id.toString(),
        manufacturerId: 'non-existent-manufacturer-id',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should not create a product with invalid attributes', async () => {
    const template = await createTemplate.execute({
      name: 'Electronics Template',
      productAttributes: {
        brand: templateAttr.string(),
        model: templateAttr.string(),
      },
    });

    await expect(
      sut.execute({
        name: 'Test Product',
        code: 'TEST-001',
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
      name: 'Electronics Template',
      productAttributes: {
        brand: templateAttr.string({ required: true }),
        model: templateAttr.string(),
      },
    });

    await expect(
      sut.execute({
        name: 'Test Product',
        code: 'TEST-001',
        templateId: template.template.id.toString(),
        attributes: {
          model: 'X123', // Missing required 'brand'
        },
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should validate attribute types', async () => {
    const template = await createTemplate.execute({
      name: 'Electronics Template',
      productAttributes: {
        warranty: templateAttr.number({ unitOfMeasure: 'months' }),
      },
    });

    await expect(
      sut.execute({
        name: 'Test Product',
        code: 'TEST-001',
        templateId: template.template.id.toString(),
        attributes: {
          warranty: 'invalid-number', // Should be a number
        },
      }),
    ).rejects.toThrow(BadRequestError);
  });
});
