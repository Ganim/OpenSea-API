import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryManufacturersRepository } from '@/repositories/stock/in-memory/in-memory-manufacturers-repository';
import { InMemoryProductsRepository } from '@/repositories/stock/in-memory/in-memory-products-repository';
import { InMemorySuppliersRepository } from '@/repositories/stock/in-memory/in-memory-suppliers-repository';
import { InMemoryTemplatesRepository } from '@/repositories/stock/in-memory/in-memory-templates-repository';
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
let sut: DeleteProductUseCase;
let createProduct: CreateProductUseCase;
let getProduct: GetProductByIdUseCase;
let createTemplate: CreateTemplateUseCase;

describe('DeleteProductUseCase', () => {
  beforeEach(() => {
    productsRepository = new InMemoryProductsRepository();
    templatesRepository = new InMemoryTemplatesRepository();
    suppliersRepository = new InMemorySuppliersRepository();
    manufacturersRepository = new InMemoryManufacturersRepository();

    sut = new DeleteProductUseCase(productsRepository);
    createProduct = new CreateProductUseCase(
      productsRepository,
      templatesRepository,
      suppliersRepository,
      manufacturersRepository,
    );
    getProduct = new GetProductByIdUseCase(productsRepository);
    createTemplate = new CreateTemplateUseCase(templatesRepository);
  });

  it('should delete a product', async () => {
    const template = await createTemplate.execute({
      name: 'Electronics Template',
      productAttributes: { brand: templateAttr.string() },
    });

    const created = await createProduct.execute({
      name: 'Laptop Dell',
      code: 'LAPTOP-001',
      templateId: template.template.id.toString(),
    });

    await sut.execute({ id: created.product.id.toString() });

    await expect(
      getProduct.execute({ id: created.product.id.toString() }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should throw error if product not found', async () => {
    await expect(sut.execute({ id: 'non-existent-id' })).rejects.toThrow(
      ResourceNotFoundError,
    );
  });
});
