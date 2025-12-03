import { InMemoryManufacturersRepository } from '@/repositories/stock/in-memory/in-memory-manufacturers-repository';
import { InMemoryProductsRepository } from '@/repositories/stock/in-memory/in-memory-products-repository';
import { InMemorySuppliersRepository } from '@/repositories/stock/in-memory/in-memory-suppliers-repository';
import { InMemoryTemplatesRepository } from '@/repositories/stock/in-memory/in-memory-templates-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateTemplateUseCase } from '../templates/create-template';
import { CreateProductUseCase } from './create-product';
import { ListProductsUseCase } from './list-products';

let productsRepository: InMemoryProductsRepository;
let templatesRepository: InMemoryTemplatesRepository;
let suppliersRepository: InMemorySuppliersRepository;
let manufacturersRepository: InMemoryManufacturersRepository;
let sut: ListProductsUseCase;
let createProduct: CreateProductUseCase;
let createTemplate: CreateTemplateUseCase;

describe('ListProductsUseCase', () => {
  beforeEach(() => {
    productsRepository = new InMemoryProductsRepository();
    templatesRepository = new InMemoryTemplatesRepository();
    suppliersRepository = new InMemorySuppliersRepository();
    manufacturersRepository = new InMemoryManufacturersRepository();

    sut = new ListProductsUseCase(productsRepository);
    createProduct = new CreateProductUseCase(
      productsRepository,
      templatesRepository,
      suppliersRepository,
      manufacturersRepository,
    );
    createTemplate = new CreateTemplateUseCase(templatesRepository);
  });

  it('should list all products', async () => {
    const template = await createTemplate.execute({
      name: 'Electronics Template',
      productAttributes: { brand: 'string' },
    });

    await createProduct.execute({
      name: 'Laptop Dell',
      code: 'LAPTOP-001',
      templateId: template.template.id.toString(),
    });

    await createProduct.execute({
      name: 'Mouse Logitech',
      code: 'MOUSE-001',
      templateId: template.template.id.toString(),
    });

    const result = await sut.execute();

    expect(result.products).toHaveLength(2);
    expect(result.products[0].name).toBe('Laptop Dell');
    expect(result.products[1].name).toBe('Mouse Logitech');
  });

  it('should return empty array when no products exist', async () => {
    const result = await sut.execute();

    expect(result.products).toHaveLength(0);
  });
});
