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
import { UpdateProductUseCase } from './update-product';

let productsRepository: InMemoryProductsRepository;
let templatesRepository: InMemoryTemplatesRepository;
let suppliersRepository: InMemorySuppliersRepository;
let manufacturersRepository: InMemoryManufacturersRepository;
let sut: UpdateProductUseCase;
let createProduct: CreateProductUseCase;
let createTemplate: CreateTemplateUseCase;
let createSupplier: CreateSupplierUseCase;
let createManufacturer: CreateManufacturerUseCase;

describe('UpdateProductUseCase', () => {
  beforeEach(() => {
    productsRepository = new InMemoryProductsRepository();
    templatesRepository = new InMemoryTemplatesRepository();
    suppliersRepository = new InMemorySuppliersRepository();
    manufacturersRepository = new InMemoryManufacturersRepository();

    sut = new UpdateProductUseCase(
      productsRepository,
      templatesRepository,
      suppliersRepository,
      manufacturersRepository,
    );
    createProduct = new CreateProductUseCase(
      productsRepository,
      templatesRepository,
      suppliersRepository,
      manufacturersRepository,
    );
    createTemplate = new CreateTemplateUseCase(templatesRepository);
    createSupplier = new CreateSupplierUseCase(suppliersRepository);
    createManufacturer = new CreateManufacturerUseCase(manufacturersRepository);
  });

  it('should update a product', async () => {
    const template = await createTemplate.execute({
      name: 'Electronics Template',
      productAttributes: { brand: 'string' },
    });

    const created = await createProduct.execute({
      name: 'Laptop Dell',
      code: 'LAPTOP-001',
      unitOfMeasure: 'UNITS',
      templateId: template.template.id,
    });

    const result = await sut.execute({
      id: created.product.id,
      name: 'Laptop Dell Inspiron',
      description: 'Updated description',
      status: 'ACTIVE',
    });

    expect(result.product).toEqual(
      expect.objectContaining({
        id: created.product.id,
        name: 'Laptop Dell Inspiron',
        description: 'Updated description',
        status: 'ACTIVE',
      }),
    );
  });

  it('should update only provided fields', async () => {
    const template = await createTemplate.execute({
      name: 'Electronics Template',
      productAttributes: { brand: 'string' },
    });

    const created = await createProduct.execute({
      name: 'Laptop Dell',
      code: 'LAPTOP-001',
      description: 'Original',
      unitOfMeasure: 'UNITS',
      templateId: template.template.id,
    });

    const result = await sut.execute({
      id: created.product.id,
      description: 'Updated',
    });

    expect(result.product.name).toBe('Laptop Dell');
    expect(result.product.code).toBe('LAPTOP-001');
    expect(result.product.description).toBe('Updated');
  });

  it('should update product with supplier', async () => {
    const template = await createTemplate.execute({
      name: 'Electronics Template',
      productAttributes: { brand: 'string' },
    });

    const created = await createProduct.execute({
      name: 'Laptop Dell',
      code: 'LAPTOP-001',
      unitOfMeasure: 'UNITS',
      templateId: template.template.id,
    });

    const supplier = await createSupplier.execute({
      name: 'Tech Supplies Co.',
      country: 'United States',
    });

    const result = await sut.execute({
      id: created.product.id,
      supplierId: supplier.supplier.id,
    });

    expect(result.product.supplierId).toBe(supplier.supplier.id);
  });

  it('should update product with manufacturer', async () => {
    const template = await createTemplate.execute({
      name: 'Electronics Template',
      productAttributes: { brand: 'string' },
    });

    const created = await createProduct.execute({
      name: 'Laptop Dell',
      code: 'LAPTOP-001',
      unitOfMeasure: 'UNITS',
      templateId: template.template.id,
    });

    const manufacturer = await createManufacturer.execute({
      name: 'Dell Inc.',
      country: 'United States',
    });

    const result = await sut.execute({
      id: created.product.id,
      manufacturerId: manufacturer.manufacturer.id,
    });

    expect(result.product.manufacturerId).toBe(manufacturer.manufacturer.id);
  });

  it('should throw error if product not found', async () => {
    await expect(
      sut.execute({
        id: 'non-existent-id',
        name: 'Updated Name',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should not update with empty name', async () => {
    const template = await createTemplate.execute({
      name: 'Electronics Template',
      productAttributes: { brand: 'string' },
    });

    const created = await createProduct.execute({
      name: 'Laptop Dell',
      code: 'LAPTOP-001',
      unitOfMeasure: 'UNITS',
      templateId: template.template.id,
    });

    await expect(
      sut.execute({
        id: created.product.id,
        name: '',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not update with duplicate name', async () => {
    const template = await createTemplate.execute({
      name: 'Electronics Template',
      productAttributes: { brand: 'string' },
    });

    await createProduct.execute({
      name: 'Laptop Dell',
      code: 'LAPTOP-001',
      unitOfMeasure: 'UNITS',
      templateId: template.template.id,
    });

    const second = await createProduct.execute({
      name: 'Mouse Logitech',
      code: 'MOUSE-001',
      unitOfMeasure: 'UNITS',
      templateId: template.template.id,
    });

    await expect(
      sut.execute({
        id: second.product.id,
        name: 'Laptop Dell',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not update with non-existent supplier', async () => {
    const template = await createTemplate.execute({
      name: 'Electronics Template',
      productAttributes: { brand: 'string' },
    });

    const created = await createProduct.execute({
      name: 'Laptop Dell',
      code: 'LAPTOP-001',
      unitOfMeasure: 'UNITS',
      templateId: template.template.id,
    });

    await expect(
      sut.execute({
        id: created.product.id,
        supplierId: 'non-existent-supplier-id',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should not update with non-existent manufacturer', async () => {
    const template = await createTemplate.execute({
      name: 'Electronics Template',
      productAttributes: { brand: 'string' },
    });

    const created = await createProduct.execute({
      name: 'Laptop Dell',
      code: 'LAPTOP-001',
      unitOfMeasure: 'UNITS',
      templateId: template.template.id,
    });

    await expect(
      sut.execute({
        id: created.product.id,
        manufacturerId: 'non-existent-manufacturer-id',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should not update with invalid attributes', async () => {
    const template = await createTemplate.execute({
      name: 'Electronics Template',
      productAttributes: { brand: 'string', model: 'string' },
    });

    const created = await createProduct.execute({
      name: 'Laptop Dell',
      code: 'LAPTOP-001',
      unitOfMeasure: 'UNITS',
      templateId: template.template.id,
      attributes: { brand: 'Dell' },
    });

    await expect(
      sut.execute({
        id: created.product.id,
        attributes: {
          brand: 'HP',
          invalidAttribute: 'value',
        },
      }),
    ).rejects.toThrow(BadRequestError);
  });
});
