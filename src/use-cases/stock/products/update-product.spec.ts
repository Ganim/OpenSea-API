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
      productAttributes: { brand: templateAttr.string() },
    });

    const created = await createProduct.execute({
      name: 'Laptop Dell',
      code: 'LAPTOP-001',
      templateId: template.template.id.toString(),
    });

    const result = await sut.execute({
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
      name: 'Electronics Template',
      productAttributes: { brand: templateAttr.string() },
    });

    const created = await createProduct.execute({
      name: 'Laptop Dell',
      code: 'LAPTOP-001',
      description: 'Original',
      templateId: template.template.id.toString(),
    });

    const result = await sut.execute({
      id: created.product.id.toString(),
      description: 'Updated',
    });

    expect(result.product.name).toBe('Laptop Dell');
    expect(result.product.code).toBe('LAPTOP-001');
    expect(result.product.description).toBe('Updated');
  });

  it('should update product with supplier', async () => {
    const template = await createTemplate.execute({
      name: 'Electronics Template',
      productAttributes: { brand: templateAttr.string() },
    });

    const created = await createProduct.execute({
      name: 'Laptop Dell',
      code: 'LAPTOP-001',
      templateId: template.template.id.toString(),
    });

    const supplier = await createSupplier.execute({
      name: 'Tech Supplies Co.',
      country: 'United States',
    });

    const result = await sut.execute({
      id: created.product.id.toString(),
      supplierId: supplier.supplier.id.toString(),
    });

    expect(result.product.supplierId?.toString()).toBe(
      supplier.supplier.id.toString(),
    );
  });

  it('should update product with manufacturer', async () => {
    const template = await createTemplate.execute({
      name: 'Electronics Template',
      productAttributes: { brand: templateAttr.string() },
    });

    const created = await createProduct.execute({
      name: 'Laptop Dell',
      code: 'LAPTOP-001',
      templateId: template.template.id.toString(),
    });

    const manufacturer = await createManufacturer.execute({
      name: 'Dell Inc.',
      country: 'United States',
    });

    const result = await sut.execute({
      id: created.product.id.toString(),
      manufacturerId: manufacturer.manufacturer.manufacturerId.toString(),
    });

    expect(result.product.manufacturerId?.toString()).toBe(
      manufacturer.manufacturer.manufacturerId.toString(),
    );
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
      productAttributes: { brand: templateAttr.string() },
    });

    const created = await createProduct.execute({
      name: 'Laptop Dell',
      code: 'LAPTOP-001',
      templateId: template.template.id.toString(),
    });

    await expect(
      sut.execute({
        id: created.product.id.toString(),
        name: '',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not update with duplicate name', async () => {
    const template = await createTemplate.execute({
      name: 'Electronics Template',
      productAttributes: { brand: templateAttr.string() },
    });

    await createProduct.execute({
      name: 'Laptop Dell',
      code: 'LAPTOP-001',
      templateId: template.template.id.toString(),
    });

    const second = await createProduct.execute({
      name: 'Mouse Logitech',
      code: 'MOUSE-001',
      templateId: template.template.id.toString(),
    });

    await expect(
      sut.execute({
        id: second.product.id.toString(),
        name: 'Laptop Dell',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not update with non-existent supplier', async () => {
    const template = await createTemplate.execute({
      name: 'Electronics Template',
      productAttributes: { brand: templateAttr.string() },
    });

    const created = await createProduct.execute({
      name: 'Laptop Dell',
      code: 'LAPTOP-001',
      templateId: template.template.id.toString(),
    });

    await expect(
      sut.execute({
        id: created.product.id.toString(),
        supplierId: 'non-existent-supplier-id',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should not update with non-existent manufacturer', async () => {
    const template = await createTemplate.execute({
      name: 'Electronics Template',
      productAttributes: { brand: templateAttr.string() },
    });

    const created = await createProduct.execute({
      name: 'Laptop Dell',
      code: 'LAPTOP-001',
      templateId: template.template.id.toString(),
    });

    await expect(
      sut.execute({
        id: created.product.id.toString(),
        manufacturerId: 'non-existent-manufacturer-id',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should not update with invalid attributes', async () => {
    const template = await createTemplate.execute({
      name: 'Electronics Template',
      productAttributes: { brand: templateAttr.string(), model: templateAttr.string() },
    });

    const created = await createProduct.execute({
      name: 'Laptop Dell',
      code: 'LAPTOP-001',
      templateId: template.template.id.toString(),
      attributes: { brand: 'Dell' },
    });

    await expect(
      sut.execute({
        id: created.product.id.toString(),
        attributes: {
          brand: 'HP',
          invalidAttribute: 'value',
        },
      }),
    ).rejects.toThrow(BadRequestError);
  });
});
