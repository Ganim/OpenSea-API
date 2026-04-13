import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryProductCareInstructionsRepository } from '@/repositories/stock/in-memory/in-memory-product-care-instructions-repository';
import { InMemoryProductsRepository } from '@/repositories/stock/in-memory/in-memory-products-repository';
import { InMemoryTemplatesRepository } from '@/repositories/stock/in-memory/in-memory-templates-repository';
import { InMemoryCategoriesRepository } from '@/repositories/stock/in-memory/in-memory-categories-repository';
import { InMemoryManufacturersRepository } from '@/repositories/stock/in-memory/in-memory-manufacturers-repository';
import { CareCatalogProvider } from '@/services/care/care-catalog-provider';
import { templateAttr } from '@/utils/tests/factories/stock/make-template';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateProductUseCase } from '../products/create-product';
import { CreateTemplateUseCase } from '../templates/create-template';
import { CreateProductCareInstructionUseCase } from './create-product-care-instruction';

let productCareInstructionsRepository: InMemoryProductCareInstructionsRepository;
let productsRepository: InMemoryProductsRepository;
let templatesRepository: InMemoryTemplatesRepository;
let manufacturersRepository: InMemoryManufacturersRepository;
let categoriesRepository: InMemoryCategoriesRepository;
let careCatalogProvider: CareCatalogProvider;
let sut: CreateProductCareInstructionUseCase;
let createTemplate: CreateTemplateUseCase;
let createProduct: CreateProductUseCase;

const TENANT_ID = 'tenant-1';

describe('CreateProductCareInstructionUseCase', () => {
  beforeEach(() => {
    productCareInstructionsRepository =
      new InMemoryProductCareInstructionsRepository();
    productsRepository = new InMemoryProductsRepository();
    templatesRepository = new InMemoryTemplatesRepository();
    manufacturersRepository = new InMemoryManufacturersRepository();
    categoriesRepository = new InMemoryCategoriesRepository();

    CareCatalogProvider.resetInstance();
    careCatalogProvider = CareCatalogProvider.getInstance();

    sut = new CreateProductCareInstructionUseCase(
      productCareInstructionsRepository,
      productsRepository,
      templatesRepository,
      careCatalogProvider,
    );

    createTemplate = new CreateTemplateUseCase(templatesRepository);
    createProduct = new CreateProductUseCase(
      productsRepository,
      templatesRepository,
      manufacturersRepository,
      categoriesRepository,
    );
  });

  it('should create a product care instruction when template has CARE_INSTRUCTIONS module', async () => {
    const { template } = await createTemplate.execute({
      tenantId: TENANT_ID,
      name: 'Textile Template',
      specialModules: ['CARE_INSTRUCTIONS'],
      productAttributes: { brand: templateAttr.string() },
    });

    const { product } = await createProduct.execute({
      tenantId: TENANT_ID,
      name: 'Cotton T-Shirt',
      templateId: template.id.toString(),
    });

    const result = await sut.execute({
      productId: product.id.toString(),
      tenantId: TENANT_ID,
      careInstructionId: 'WASH_30',
      order: 1,
    });

    expect(result.productCareInstruction).toBeDefined();
    expect(result.productCareInstruction.id).toBeDefined();
    expect(result.productCareInstruction.productId).toBe(product.id.toString());
    expect(result.productCareInstruction.careInstructionId).toBe('WASH_30');
    expect(result.productCareInstruction.order).toBe(1);
  });

  it('should reject when template does not have CARE_INSTRUCTIONS module', async () => {
    const { template } = await createTemplate.execute({
      tenantId: TENANT_ID,
      name: 'Electronics Template',
      productAttributes: { brand: templateAttr.string() },
    });

    const { product } = await createProduct.execute({
      tenantId: TENANT_ID,
      name: 'Laptop',
      templateId: template.id.toString(),
    });

    await expect(
      sut.execute({
        productId: product.id.toString(),
        tenantId: TENANT_ID,
        careInstructionId: 'WASH_30',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should reject invalid care instruction ID', async () => {
    const { template } = await createTemplate.execute({
      tenantId: TENANT_ID,
      name: 'Textile Template',
      specialModules: ['CARE_INSTRUCTIONS'],
      productAttributes: { brand: templateAttr.string() },
    });

    const { product } = await createProduct.execute({
      tenantId: TENANT_ID,
      name: 'Cotton T-Shirt 2',
      templateId: template.id.toString(),
    });

    await expect(
      sut.execute({
        productId: product.id.toString(),
        tenantId: TENANT_ID,
        careInstructionId: 'INVALID_CODE',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should reject duplicate care instruction for same product', async () => {
    const { template } = await createTemplate.execute({
      tenantId: TENANT_ID,
      name: 'Textile Template',
      specialModules: ['CARE_INSTRUCTIONS'],
      productAttributes: { brand: templateAttr.string() },
    });

    const { product } = await createProduct.execute({
      tenantId: TENANT_ID,
      name: 'Cotton T-Shirt 3',
      templateId: template.id.toString(),
    });

    await sut.execute({
      productId: product.id.toString(),
      tenantId: TENANT_ID,
      careInstructionId: 'WASH_30',
    });

    await expect(
      sut.execute({
        productId: product.id.toString(),
        tenantId: TENANT_ID,
        careInstructionId: 'WASH_30',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should reject when product not found', async () => {
    await expect(
      sut.execute({
        productId: 'non-existent-id',
        tenantId: TENANT_ID,
        careInstructionId: 'WASH_30',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
