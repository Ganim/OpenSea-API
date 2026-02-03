import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { InMemoryTemplatesRepository } from '@/repositories/stock/in-memory/in-memory-templates-repository';
import { templateAttr } from '@/utils/tests/factories/stock/make-template';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateTemplateUseCase } from './create-template';

let templatesRepository: InMemoryTemplatesRepository;
let sut: CreateTemplateUseCase;

describe('CreateTemplateUseCase', () => {
  beforeEach(() => {
    templatesRepository = new InMemoryTemplatesRepository();
    sut = new CreateTemplateUseCase(templatesRepository);
  });

  it('should create a template', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      name: 'Electronics Template',
      productAttributes: {
        brand: templateAttr.string(),
        model: templateAttr.string(),
        warranty: templateAttr.number({ unitOfMeasure: 'months' }),
      },
      variantAttributes: {
        color: templateAttr.string({ enablePrint: true }),
        storage: templateAttr.string(),
      },
      itemAttributes: {
        serialNumber: templateAttr.string({ required: true }),
        condition: templateAttr.select(['NEW', 'USED', 'REFURBISHED']),
      },
    });

    expect(result.template).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        name: 'Electronics Template',
      }),
    );
    expect(result.template.productAttributes).toHaveProperty('brand');
    expect(result.template.productAttributes.brand.type).toBe('string');
    expect(result.template.variantAttributes).toHaveProperty('color');
    expect(result.template.itemAttributes).toHaveProperty('serialNumber');
    expect(result.template.itemAttributes.serialNumber.required).toBe(true);
  });

  it('should create a template with only product attributes', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      name: 'Simple Template',
      productAttributes: {
        category: templateAttr.string(),
      },
    });

    expect(result.template.name).toBe('Simple Template');
    expect(result.template.productAttributes.category.type).toBe('string');
    expect(result.template.variantAttributes).toEqual({});
    expect(result.template.itemAttributes).toEqual({});
  });

  it('should not create a template with empty name', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        name: '',
        productAttributes: { test: templateAttr.string() },
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not create a template with name longer than 200 characters', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        name: 'a'.repeat(201),
        productAttributes: { test: templateAttr.string() },
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not create a template with duplicate name', async () => {
    await sut.execute({
      tenantId: 'tenant-1',
      name: 'Electronics Template',
      productAttributes: { brand: templateAttr.string() },
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        name: 'Electronics Template',
        productAttributes: { model: templateAttr.string() },
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should create a template without any attributes', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      name: 'Empty Template',
    });

    expect(result.template).toMatchObject({
      name: 'Empty Template',
      productAttributes: {},
      variantAttributes: {},
      itemAttributes: {},
    });
  });

  it('should create a template with empty attribute objects', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      name: 'Empty Attributes Template',
      productAttributes: {},
      variantAttributes: {},
      itemAttributes: {},
    });

    expect(result.template).toMatchObject({
      name: 'Empty Attributes Template',
      productAttributes: {},
      variantAttributes: {},
      itemAttributes: {},
    });
  });

  it('should create a template with iconUrl', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      name: 'Template with Icon',
      iconUrl: 'https://example.com/icon.svg',
      productAttributes: { name: templateAttr.string() },
    });

    expect(result.template.iconUrl).toBe('https://example.com/icon.svg');
  });

  it('should create a template with all attribute options', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      name: 'Full Options Template',
      productAttributes: {
        weight: templateAttr.number({
          required: true,
          unitOfMeasure: 'kg',
          enablePrint: true,
          enableView: true,
          description: 'Product weight in kilograms',
        }),
        category: templateAttr.select(['A', 'B', 'C'], {
          required: true,
          enableView: true,
        }),
      },
    });

    expect(result.template.productAttributes.weight).toMatchObject({
      type: 'number',
      required: true,
      unitOfMeasure: 'kg',
      enablePrint: true,
      enableView: true,
    });
    expect(result.template.productAttributes.category.options).toEqual([
      'A',
      'B',
      'C',
    ]);
  });
});
