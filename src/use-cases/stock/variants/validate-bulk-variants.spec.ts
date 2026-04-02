import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryProductsRepository } from '@/repositories/stock/in-memory/in-memory-products-repository';
import { InMemoryTemplatesRepository } from '@/repositories/stock/in-memory/in-memory-templates-repository';
import { templateAttr } from '@/utils/tests/factories/stock/make-template';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateTemplateUseCase } from '../templates/create-template';
import { CreateProductUseCase } from '../products/create-product';
import { ValidateBulkVariantsUseCase } from './validate-bulk-variants';

const TENANT_ID = 'tenant-1';

let productsRepository: InMemoryProductsRepository;
let templatesRepository: InMemoryTemplatesRepository;
let sut: ValidateBulkVariantsUseCase;
let createTemplate: CreateTemplateUseCase;
let createProduct: CreateProductUseCase;
let templateId: string;

describe('ValidateBulkVariantsUseCase', () => {
  beforeEach(async () => {
    productsRepository = new InMemoryProductsRepository();
    templatesRepository = new InMemoryTemplatesRepository();

    sut = new ValidateBulkVariantsUseCase(
      productsRepository,
      templatesRepository,
    );

    createTemplate = new CreateTemplateUseCase(templatesRepository);
    createProduct = new CreateProductUseCase(
      productsRepository,
      templatesRepository,
      { findById: async () => null } as unknown,
      { findById: async () => null } as unknown,
      { findById: async () => null } as unknown,
    );

    const templateResult = await createTemplate.execute({
      tenantId: TENANT_ID,
      name: 'Vestuário',
      unitOfMeasure: 'UNITS',
      productAttributes: { material: templateAttr.string() },
      variantAttributes: {},
      itemAttributes: {},
    });
    templateId = templateResult.template.id.toString();
  });

  it('should return all products as existing when they exist', async () => {
    await createProduct.execute({
      tenantId: TENANT_ID,
      name: 'Camiseta',
      templateId,
    });
    await createProduct.execute({
      tenantId: TENANT_ID,
      name: 'Calça',
      templateId,
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      productNames: ['Camiseta', 'Calça'],
      templateId,
    });

    expect(result.existingProducts).toHaveLength(2);
    expect(result.missingProducts).toHaveLength(0);
    expect(result.templateValid).toBe(true);
  });

  it('should detect missing products', async () => {
    await createProduct.execute({
      tenantId: TENANT_ID,
      name: 'Camiseta',
      templateId,
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      productNames: ['Camiseta', 'Vestido'],
      templateId,
    });

    expect(result.existingProducts).toHaveLength(1);
    expect(result.existingProducts[0].name).toBe('Camiseta');
    expect(result.missingProducts).toHaveLength(1);
    expect(result.missingProducts[0]).toBe('Vestido');
  });

  it('should detect invalid template', async () => {
    const result = await sut.execute({
      tenantId: TENANT_ID,
      productNames: [],
      templateId: new UniqueEntityID().toString(),
    });

    expect(result.templateValid).toBe(false);
  });

  it('should handle empty product names', async () => {
    const result = await sut.execute({
      tenantId: TENANT_ID,
      productNames: [],
      templateId,
    });

    expect(result.existingProducts).toHaveLength(0);
    expect(result.missingProducts).toHaveLength(0);
    expect(result.templateValid).toBe(true);
  });

  it('should match product names case-insensitively', async () => {
    await createProduct.execute({
      tenantId: TENANT_ID,
      name: 'Camiseta Polo',
      templateId,
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      productNames: ['camiseta polo'],
      templateId,
    });

    expect(result.existingProducts).toHaveLength(1);
    expect(result.missingProducts).toHaveLength(0);
  });

  it('should return all products as missing when none exist', async () => {
    const result = await sut.execute({
      tenantId: TENANT_ID,
      productNames: ['Produto A', 'Produto B', 'Produto C'],
      templateId,
    });

    expect(result.existingProducts).toHaveLength(0);
    expect(result.missingProducts).toHaveLength(3);
  });
});
