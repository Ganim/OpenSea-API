import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryCategoriesRepository } from '@/repositories/stock/in-memory/in-memory-categories-repository';
import { InMemoryManufacturersRepository } from '@/repositories/stock/in-memory/in-memory-manufacturers-repository';
import { InMemoryProductsRepository } from '@/repositories/stock/in-memory/in-memory-products-repository';
import { InMemoryTemplatesRepository } from '@/repositories/stock/in-memory/in-memory-templates-repository';
import { templateAttr } from '@/utils/tests/factories/stock/make-template';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateTemplateUseCase } from '../templates/create-template';
import { CreateProductUseCase } from './create-product';
import { ValidateBulkProductsUseCase } from './validate-bulk-products';

const TENANT_ID = 'tenant-1';

let productsRepository: InMemoryProductsRepository;
let categoriesRepository: InMemoryCategoriesRepository;
let manufacturersRepository: InMemoryManufacturersRepository;
let templatesRepository: InMemoryTemplatesRepository;
let sut: ValidateBulkProductsUseCase;
let createTemplate: CreateTemplateUseCase;
let createProduct: CreateProductUseCase;
let templateId: string;

describe('ValidateBulkProductsUseCase', () => {
  beforeEach(async () => {
    productsRepository = new InMemoryProductsRepository();
    categoriesRepository = new InMemoryCategoriesRepository();
    manufacturersRepository = new InMemoryManufacturersRepository();
    templatesRepository = new InMemoryTemplatesRepository();

    sut = new ValidateBulkProductsUseCase(
      productsRepository,
      categoriesRepository,
      manufacturersRepository,
      templatesRepository,
    );

    createTemplate = new CreateTemplateUseCase(templatesRepository);
    createProduct = new CreateProductUseCase(
      productsRepository,
      templatesRepository,
      { findById: async () => null } as unknown,
      manufacturersRepository,
      categoriesRepository,
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

  it('should return no issues when everything is new', async () => {
    const result = await sut.execute({
      tenantId: TENANT_ID,
      productNames: ['Produto A', 'Produto B'],
      categoryNames: [],
      manufacturerNames: [],
      templateId,
    });

    expect(result.duplicateProducts).toHaveLength(0);
    expect(result.existingCategories).toHaveLength(0);
    expect(result.missingCategories).toHaveLength(0);
    expect(result.existingManufacturers).toHaveLength(0);
    expect(result.missingManufacturers).toHaveLength(0);
    expect(result.templateValid).toBe(true);
  });

  it('should detect duplicate product names', async () => {
    await createProduct.execute({
      tenantId: TENANT_ID,
      name: 'Produto Existente',
      templateId,
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      productNames: ['Produto Existente', 'Produto Novo'],
      categoryNames: [],
      manufacturerNames: [],
      templateId,
    });

    expect(result.duplicateProducts).toHaveLength(1);
    expect(result.duplicateProducts[0].name).toBe('Produto Existente');
  });

  it('should detect existing and missing categories', async () => {
    await categoriesRepository.create({
      tenantId: TENANT_ID,
      name: 'Roupas',
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      productNames: [],
      categoryNames: ['Roupas', 'Acessórios'],
      manufacturerNames: [],
      templateId,
    });

    expect(result.existingCategories).toHaveLength(1);
    expect(result.existingCategories[0].name).toBe('Roupas');
    expect(result.missingCategories).toHaveLength(1);
    expect(result.missingCategories[0]).toBe('Acessórios');
  });

  it('should detect existing and missing manufacturers', async () => {
    await manufacturersRepository.create({
      tenantId: TENANT_ID,
      name: 'Fabricante X',
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      productNames: [],
      categoryNames: [],
      manufacturerNames: ['Fabricante X', 'Fabricante Y'],
      templateId,
    });

    expect(result.existingManufacturers).toHaveLength(1);
    expect(result.existingManufacturers[0].name).toBe('Fabricante X');
    expect(result.missingManufacturers).toHaveLength(1);
    expect(result.missingManufacturers[0]).toBe('Fabricante Y');
  });

  it('should detect invalid template', async () => {
    const result = await sut.execute({
      tenantId: TENANT_ID,
      productNames: [],
      categoryNames: [],
      manufacturerNames: [],
      templateId: new UniqueEntityID().toString(),
    });

    expect(result.templateValid).toBe(false);
  });

  it('should handle empty arrays', async () => {
    const result = await sut.execute({
      tenantId: TENANT_ID,
      productNames: [],
      categoryNames: [],
      manufacturerNames: [],
      templateId,
    });

    expect(result.duplicateProducts).toHaveLength(0);
    expect(result.existingCategories).toHaveLength(0);
    expect(result.missingCategories).toHaveLength(0);
    expect(result.existingManufacturers).toHaveLength(0);
    expect(result.missingManufacturers).toHaveLength(0);
    expect(result.templateValid).toBe(true);
  });

  it('should match category names case-insensitively', async () => {
    await categoriesRepository.create({
      tenantId: TENANT_ID,
      name: 'Roupas',
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      productNames: [],
      categoryNames: ['roupas'],
      manufacturerNames: [],
      templateId,
    });

    expect(result.existingCategories).toHaveLength(1);
    expect(result.missingCategories).toHaveLength(0);
  });
});
