import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryManufacturersRepository } from '@/repositories/stock/in-memory/in-memory-manufacturers-repository';
import { InMemoryProductsRepository } from '@/repositories/stock/in-memory/in-memory-products-repository';
import { InMemorySuppliersRepository } from '@/repositories/stock/in-memory/in-memory-suppliers-repository';
import { InMemoryTemplatesRepository } from '@/repositories/stock/in-memory/in-memory-templates-repository';
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
        brand: 'string',
        model: 'string',
        warranty: 'number',
      },
    });

    const result = await sut.execute({
      name: 'Laptop Dell Inspiron',
      code: 'LAPTOP-001',
      description: 'High performance laptop',
      status: 'ACTIVE',
      unitOfMeasure: 'UNITS',
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
        unitOfMeasure: expect.any(Object), // UnitOfMeasure
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
      productAttributes: { brand: 'string' },
    });

    const supplier = await createSupplier.execute({
      name: 'Tech Supplies Co.',
      country: 'United States',
    });

    const result = await sut.execute({
      name: 'Laptop Dell',
      code: 'LAPTOP-001',
      unitOfMeasure: 'UNITS',
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
      productAttributes: { brand: 'string' },
    });

    const manufacturer = await createManufacturer.execute({
      name: 'Dell Inc.',
      country: 'United States',
    });

    const result = await sut.execute({
      name: 'Laptop Dell',
      code: 'LAPTOP-001',
      unitOfMeasure: 'UNITS',
      templateId: template.template.id.toString(),
      manufacturerId: manufacturer.manufacturer.manufacturerId.toString(),
    });

    expect(result.product.manufacturerId?.toString()).toBe(
      manufacturer.manufacturer.manufacturerId.toString(),
    );
  });

  it('should create a product with default DRAFT status', async () => {
    const template = await createTemplate.execute({
      name: 'Simple Template',
      productAttributes: { category: 'string' },
    });

    const result = await sut.execute({
      name: 'Test Product',
      code: 'TEST-001',
      unitOfMeasure: 'UNITS',
      templateId: template.template.id.toString(),
    });

    expect(result.product.status.status).toBe('DRAFT');
  });

  it('should create a product without optional fields', async () => {
    const template = await createTemplate.execute({
      name: 'Simple Template',
      productAttributes: { category: 'string' },
    });

    const result = await sut.execute({
      name: 'Simple Product',
      code: 'SIMPLE-001',
      unitOfMeasure: 'UNITS',
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
      productAttributes: { category: 'string' },
    });

    await expect(
      sut.execute({
        name: '',
        code: 'TEST-001',
        unitOfMeasure: 'UNITS',
        templateId: template.template.id.toString(),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not create a product with name longer than 200 characters', async () => {
    const template = await createTemplate.execute({
      name: 'Simple Template',
      productAttributes: { category: 'string' },
    });

    await expect(
      sut.execute({
        name: 'a'.repeat(201),
        code: 'TEST-001',
        unitOfMeasure: 'UNITS',
        templateId: template.template.id.toString(),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not create a product with empty code', async () => {
    const template = await createTemplate.execute({
      name: 'Simple Template',
      productAttributes: { category: 'string' },
    });

    await expect(
      sut.execute({
        name: 'Test Product',
        code: '',
        unitOfMeasure: 'UNITS',
        templateId: template.template.id.toString(),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not create a product with code longer than 100 characters', async () => {
    const template = await createTemplate.execute({
      name: 'Simple Template',
      productAttributes: { category: 'string' },
    });

    await expect(
      sut.execute({
        name: 'Test Product',
        code: 'a'.repeat(101),
        unitOfMeasure: 'UNITS',
        templateId: template.template.id.toString(),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not create a product with duplicate name', async () => {
    const template = await createTemplate.execute({
      name: 'Simple Template',
      productAttributes: { category: 'string' },
    });

    await sut.execute({
      name: 'Laptop Dell',
      code: 'LAPTOP-001',
      unitOfMeasure: 'UNITS',
      templateId: template.template.id.toString(),
    });

    await expect(
      sut.execute({
        name: 'Laptop Dell',
        code: 'LAPTOP-002',
        unitOfMeasure: 'UNITS',
        templateId: template.template.id.toString(),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not create a product with invalid status', async () => {
    const template = await createTemplate.execute({
      name: 'Simple Template',
      productAttributes: { category: 'string' },
    });

    await expect(
      sut.execute({
        name: 'Test Product',
        code: 'TEST-001',
        status: 'INVALID_STATUS',
        unitOfMeasure: 'UNITS',
        templateId: template.template.id.toString(),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not create a product with invalid unit of measure', async () => {
    const template = await createTemplate.execute({
      name: 'Simple Template',
      productAttributes: { category: 'string' },
    });

    await expect(
      sut.execute({
        name: 'Test Product',
        code: 'TEST-001',
        unitOfMeasure: 'INVALID_UNIT',
        templateId: template.template.id.toString(),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not create a product with non-existent template', async () => {
    await expect(
      sut.execute({
        name: 'Test Product',
        code: 'TEST-001',
        unitOfMeasure: 'UNITS',
        templateId: 'non-existent-template-id',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should not create a product with non-existent supplier', async () => {
    const template = await createTemplate.execute({
      name: 'Simple Template',
      productAttributes: { category: 'string' },
    });

    await expect(
      sut.execute({
        name: 'Test Product',
        code: 'TEST-001',
        unitOfMeasure: 'UNITS',
        templateId: template.template.id.toString(),
        supplierId: 'non-existent-supplier-id',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should not create a product with non-existent manufacturer', async () => {
    const template = await createTemplate.execute({
      name: 'Simple Template',
      productAttributes: { category: 'string' },
    });

    await expect(
      sut.execute({
        name: 'Test Product',
        code: 'TEST-001',
        unitOfMeasure: 'UNITS',
        templateId: template.template.id.toString(),
        manufacturerId: 'non-existent-manufacturer-id',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should not create a product with invalid attributes', async () => {
    const template = await createTemplate.execute({
      name: 'Electronics Template',
      productAttributes: {
        brand: 'string',
        model: 'string',
      },
    });

    await expect(
      sut.execute({
        name: 'Test Product',
        code: 'TEST-001',
        unitOfMeasure: 'UNITS',
        templateId: template.template.id.toString(),
        attributes: {
          brand: 'Dell',
          invalidAttribute: 'value', // Não está no template
        },
      }),
    ).rejects.toThrow(BadRequestError);
  });
});
