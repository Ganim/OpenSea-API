import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryCategoriesRepository } from '@/repositories/stock/in-memory/in-memory-categories-repository';
import { InMemoryItemsRepository } from '@/repositories/stock/in-memory/in-memory-items-repository';
import { InMemoryManufacturersRepository } from '@/repositories/stock/in-memory/in-memory-manufacturers-repository';
import { InMemoryProductsRepository } from '@/repositories/stock/in-memory/in-memory-products-repository';
import { InMemoryTemplatesRepository } from '@/repositories/stock/in-memory/in-memory-templates-repository';
import { InMemoryVariantsRepository } from '@/repositories/stock/in-memory/in-memory-variants-repository';
import { templateAttr } from '@/utils/tests/factories/stock/make-template';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/workers/queues/audit.queue', () => ({
  queueAuditLog: vi.fn().mockResolvedValue(undefined),
}));
import { CreateTemplateUseCase } from '../templates/create-template';
import { CreateProductUseCase } from './create-product';
import { DeleteProductUseCase } from './delete-product';
import { GetProductByIdUseCase } from './get-product-by-id';

let productsRepository: InMemoryProductsRepository;
let templatesRepository: InMemoryTemplatesRepository;
let manufacturersRepository: InMemoryManufacturersRepository;
let categoriesRepository: InMemoryCategoriesRepository;
let variantsRepository: InMemoryVariantsRepository;
let itemsRepository: InMemoryItemsRepository;
let sut: DeleteProductUseCase;
let createProduct: CreateProductUseCase;
let getProduct: GetProductByIdUseCase;
let createTemplate: CreateTemplateUseCase;

const TENANT_ID = 'tenant-1';

describe('DeleteProductUseCase', () => {
  beforeEach(() => {
    productsRepository = new InMemoryProductsRepository();
    templatesRepository = new InMemoryTemplatesRepository();
    manufacturersRepository = new InMemoryManufacturersRepository();
    categoriesRepository = new InMemoryCategoriesRepository();
    variantsRepository = new InMemoryVariantsRepository();
    itemsRepository = new InMemoryItemsRepository();

    const fakeTransactionManager = { run: (fn: () => Promise<void>) => fn() };
    sut = new DeleteProductUseCase(
      productsRepository,
      variantsRepository,
      itemsRepository,
      fakeTransactionManager as never,
    );
    createProduct = new CreateProductUseCase(
      productsRepository,
      templatesRepository,
      manufacturersRepository,
      categoriesRepository,
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

  it('should throw BadRequestError if a variant has active items', async () => {
    const { Slug } = await import(
      '@/entities/stock/value-objects/slug'
    );
    const { ItemStatus } = await import(
      '@/entities/stock/value-objects/item-status'
    );
    const { UniqueEntityID } = await import(
      '@/entities/domain/unique-entity-id'
    );

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

    // Get the default variant created with the product
    const variants = await variantsRepository.findManyByProduct(
      created.product.id,
      TENANT_ID,
    );

    expect(variants.length).toBeGreaterThan(0);

    const variant = variants[0];

    // Create an active item for the variant
    await itemsRepository.create({
      tenantId: TENANT_ID,
      slug: Slug.create('item-1'),
      fullCode: 'TMPL.MFR.PROD.VAR-001',
      sequentialCode: 1,
      barcode: '1234567890',
      eanCode: '1234567890123',
      upcCode: '123456789012',
      variantId: variant.id,
      initialQuantity: 10,
      currentQuantity: 10,
      status: ItemStatus.create('AVAILABLE'),
    });

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        id: created.product.id.toString(),
      }),
    ).rejects.toThrow(BadRequestError);
  });
});
