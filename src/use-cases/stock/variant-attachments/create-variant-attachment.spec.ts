import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryVariantAttachmentsRepository } from '@/repositories/stock/in-memory/in-memory-variant-attachments-repository';
import { InMemoryVariantsRepository } from '@/repositories/stock/in-memory/in-memory-variants-repository';
import { InMemoryProductsRepository } from '@/repositories/stock/in-memory/in-memory-products-repository';
import { InMemoryTemplatesRepository } from '@/repositories/stock/in-memory/in-memory-templates-repository';
import { InMemoryCategoriesRepository } from '@/repositories/stock/in-memory/in-memory-categories-repository';
import { InMemoryManufacturersRepository } from '@/repositories/stock/in-memory/in-memory-manufacturers-repository';
import { templateAttr } from '@/utils/tests/factories/stock/make-template';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateProductUseCase } from '../products/create-product';
import { CreateTemplateUseCase } from '../templates/create-template';
import { CreateVariantUseCase } from '../variants/create-variant';
import { CreateVariantAttachmentUseCase } from './create-variant-attachment';

let variantAttachmentsRepository: InMemoryVariantAttachmentsRepository;
let variantsRepository: InMemoryVariantsRepository;
let productsRepository: InMemoryProductsRepository;
let templatesRepository: InMemoryTemplatesRepository;
let manufacturersRepository: InMemoryManufacturersRepository;
let categoriesRepository: InMemoryCategoriesRepository;
let sut: CreateVariantAttachmentUseCase;
let createTemplate: CreateTemplateUseCase;
let createProduct: CreateProductUseCase;
let createVariant: CreateVariantUseCase;

const TENANT_ID = 'tenant-1';

describe('CreateVariantAttachmentUseCase', () => {
  beforeEach(() => {
    variantAttachmentsRepository = new InMemoryVariantAttachmentsRepository();
    variantsRepository = new InMemoryVariantsRepository();
    productsRepository = new InMemoryProductsRepository();
    templatesRepository = new InMemoryTemplatesRepository();
    manufacturersRepository = new InMemoryManufacturersRepository();
    categoriesRepository = new InMemoryCategoriesRepository();

    sut = new CreateVariantAttachmentUseCase(
      variantAttachmentsRepository,
      variantsRepository,
    );

    createTemplate = new CreateTemplateUseCase(templatesRepository);
    createProduct = new CreateProductUseCase(
      productsRepository,
      templatesRepository,
      manufacturersRepository,
      categoriesRepository,
    );
    createVariant = new CreateVariantUseCase(
      variantsRepository,
      productsRepository,
      templatesRepository,
    );
  });

  it('should create a variant attachment', async () => {
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

    const variant = await createVariant.execute({
      tenantId: TENANT_ID,
      productId: product.id.toString(),
      name: 'Test Variant',
    });

    const result = await sut.execute({
      variantId: variant.id.toString(),
      tenantId: TENANT_ID,
      fileUrl: 'https://storage.example.com/files/photo.jpg',
      fileName: 'photo.jpg',
      fileSize: 102400,
      mimeType: 'image/jpeg',
      label: 'Variant Photo',
      order: 1,
    });

    expect(result.variantAttachment).toBeDefined();
    expect(result.variantAttachment.id).toBeDefined();
    expect(result.variantAttachment.variantId).toBe(variant.id.toString());
    expect(result.variantAttachment.fileUrl).toBe(
      'https://storage.example.com/files/photo.jpg',
    );
    expect(result.variantAttachment.fileName).toBe('photo.jpg');
    expect(result.variantAttachment.fileSize).toBe(102400);
    expect(result.variantAttachment.mimeType).toBe('image/jpeg');
    expect(result.variantAttachment.label).toBe('Variant Photo');
    expect(result.variantAttachment.order).toBe(1);
  });

  it('should throw when variant not found', async () => {
    await expect(
      sut.execute({
        variantId: 'non-existent-id',
        tenantId: TENANT_ID,
        fileUrl: 'https://storage.example.com/files/photo.jpg',
        fileName: 'photo.jpg',
        fileSize: 102400,
        mimeType: 'image/jpeg',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should throw when variant belongs to different tenant', async () => {
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

    const variant = await createVariant.execute({
      tenantId: TENANT_ID,
      productId: product.id.toString(),
      name: 'Test Variant',
    });

    await expect(
      sut.execute({
        variantId: variant.id.toString(),
        tenantId: 'different-tenant',
        fileUrl: 'https://storage.example.com/files/photo.jpg',
        fileName: 'photo.jpg',
        fileSize: 102400,
        mimeType: 'image/jpeg',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
