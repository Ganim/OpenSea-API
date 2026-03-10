import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryProductAttachmentsRepository } from '@/repositories/stock/in-memory/in-memory-product-attachments-repository';
import { InMemoryProductsRepository } from '@/repositories/stock/in-memory/in-memory-products-repository';
import { InMemoryTemplatesRepository } from '@/repositories/stock/in-memory/in-memory-templates-repository';
import { InMemoryCategoriesRepository } from '@/repositories/stock/in-memory/in-memory-categories-repository';
import { InMemoryManufacturersRepository } from '@/repositories/stock/in-memory/in-memory-manufacturers-repository';
import { InMemorySuppliersRepository } from '@/repositories/stock/in-memory/in-memory-suppliers-repository';
import { templateAttr } from '@/utils/tests/factories/stock/make-template';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateProductUseCase } from '../products/create-product';
import { CreateTemplateUseCase } from '../templates/create-template';
import { CreateProductAttachmentUseCase } from './create-product-attachment';

let productAttachmentsRepository: InMemoryProductAttachmentsRepository;
let productsRepository: InMemoryProductsRepository;
let templatesRepository: InMemoryTemplatesRepository;
let suppliersRepository: InMemorySuppliersRepository;
let manufacturersRepository: InMemoryManufacturersRepository;
let categoriesRepository: InMemoryCategoriesRepository;
let sut: CreateProductAttachmentUseCase;
let createTemplate: CreateTemplateUseCase;
let createProduct: CreateProductUseCase;

const TENANT_ID = 'tenant-1';

describe('CreateProductAttachmentUseCase', () => {
  beforeEach(() => {
    productAttachmentsRepository =
      new InMemoryProductAttachmentsRepository();
    productsRepository = new InMemoryProductsRepository();
    templatesRepository = new InMemoryTemplatesRepository();
    suppliersRepository = new InMemorySuppliersRepository();
    manufacturersRepository = new InMemoryManufacturersRepository();
    categoriesRepository = new InMemoryCategoriesRepository();

    sut = new CreateProductAttachmentUseCase(
      productAttachmentsRepository,
      productsRepository,
    );

    createTemplate = new CreateTemplateUseCase(templatesRepository);
    createProduct = new CreateProductUseCase(
      productsRepository,
      templatesRepository,
      suppliersRepository,
      manufacturersRepository,
      categoriesRepository,
    );
  });

  it('should create a product attachment', async () => {
    const { template } = await createTemplate.execute({
      tenantId: TENANT_ID,
      name: 'Generic Template',
      productAttributes: { brand: templateAttr.string() },
    });

    const { product } = await createProduct.execute({
      tenantId: TENANT_ID,
      name: 'Test Product',
      templateId: template.id.toString(),
    });

    const result = await sut.execute({
      productId: product.id.toString(),
      tenantId: TENANT_ID,
      fileUrl: 'https://storage.example.com/files/photo.jpg',
      fileName: 'photo.jpg',
      fileSize: 102400,
      mimeType: 'image/jpeg',
      label: 'Product Photo',
      order: 1,
    });

    expect(result.productAttachment).toBeDefined();
    expect(result.productAttachment.id).toBeDefined();
    expect(result.productAttachment.productId).toBe(product.id.toString());
    expect(result.productAttachment.fileUrl).toBe('https://storage.example.com/files/photo.jpg');
    expect(result.productAttachment.fileName).toBe('photo.jpg');
    expect(result.productAttachment.fileSize).toBe(102400);
    expect(result.productAttachment.mimeType).toBe('image/jpeg');
    expect(result.productAttachment.label).toBe('Product Photo');
    expect(result.productAttachment.order).toBe(1);
  });

  it('should throw when product not found', async () => {
    await expect(
      sut.execute({
        productId: 'non-existent-id',
        tenantId: TENANT_ID,
        fileUrl: 'https://storage.example.com/files/photo.jpg',
        fileName: 'photo.jpg',
        fileSize: 102400,
        mimeType: 'image/jpeg',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should throw when product belongs to different tenant', async () => {
    const { template } = await createTemplate.execute({
      tenantId: TENANT_ID,
      name: 'Generic Template',
      productAttributes: { brand: templateAttr.string() },
    });

    const { product } = await createProduct.execute({
      tenantId: TENANT_ID,
      name: 'Test Product',
      templateId: template.id.toString(),
    });

    await expect(
      sut.execute({
        productId: product.id.toString(),
        tenantId: 'different-tenant',
        fileUrl: 'https://storage.example.com/files/photo.jpg',
        fileName: 'photo.jpg',
        fileSize: 102400,
        mimeType: 'image/jpeg',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
