import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryManufacturersRepository } from '@/repositories/stock/in-memory/in-memory-manufacturers-repository';
import { InMemoryProductsRepository } from '@/repositories/stock/in-memory/in-memory-products-repository';
import { InMemorySuppliersRepository } from '@/repositories/stock/in-memory/in-memory-suppliers-repository';
import { InMemoryTemplatesRepository } from '@/repositories/stock/in-memory/in-memory-templates-repository';
import { templateAttr } from '@/utils/tests/factories/stock/make-template';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateTemplateUseCase } from '../templates/create-template';
import { CreateProductUseCase } from './create-product';
import { GetProductByIdUseCase } from './get-product-by-id';

let productsRepository: InMemoryProductsRepository;
let templatesRepository: InMemoryTemplatesRepository;
let suppliersRepository: InMemorySuppliersRepository;
let manufacturersRepository: InMemoryManufacturersRepository;
let sut: GetProductByIdUseCase;
let createProduct: CreateProductUseCase;
let createTemplate: CreateTemplateUseCase;

const TENANT_ID = 'tenant-1';

describe('GetProductByIdUseCase', () => {
  beforeEach(() => {
    productsRepository = new InMemoryProductsRepository();
    templatesRepository = new InMemoryTemplatesRepository();
    suppliersRepository = new InMemorySuppliersRepository();
    manufacturersRepository = new InMemoryManufacturersRepository();

    sut = new GetProductByIdUseCase(productsRepository);
    createProduct = new CreateProductUseCase(
      productsRepository,
      templatesRepository,
      suppliersRepository,
      manufacturersRepository,
    );
    createTemplate = new CreateTemplateUseCase(templatesRepository);
  });

  it('should get a product by id', async () => {
    const template = await createTemplate.execute({
      tenantId: TENANT_ID,
      name: 'Electronics Template',
      productAttributes: { brand: templateAttr.string() },
    });

    const created = await createProduct.execute({
      tenantId: TENANT_ID,
      name: 'Laptop Dell',
      description: 'High performance laptop',
      templateId: template.template.id.toString(),
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      id: created.product.id.toString(),
    });

    expect(result.product.id.toString()).toBe(created.product.id.toString());
    expect(result.product.name).toBe('Laptop Dell');
    expect(result.product.description).toBe('High performance laptop');
    expect(result.product.slug).toBeDefined();
    expect(result.product.status.value).toBe('ACTIVE');
  });

  it('should throw error if product not found', async () => {
    await expect(
      sut.execute({ tenantId: TENANT_ID, id: 'non-existent-id' }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
