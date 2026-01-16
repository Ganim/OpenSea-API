import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryTemplatesRepository } from '@/repositories/stock/in-memory/in-memory-templates-repository';
import { templateAttr } from '@/utils/tests/factories/stock/make-template';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateTemplateUseCase } from './create-template';
import { UpdateTemplateUseCase } from './update-template';

let templatesRepository: InMemoryTemplatesRepository;
let sut: UpdateTemplateUseCase;
let createTemplate: CreateTemplateUseCase;

describe('UpdateTemplateUseCase', () => {
  beforeEach(() => {
    templatesRepository = new InMemoryTemplatesRepository();
    sut = new UpdateTemplateUseCase(templatesRepository);
    createTemplate = new CreateTemplateUseCase(templatesRepository);
  });

  it('should update a template', async () => {
    const created = await createTemplate.execute({
      name: 'Electronics Template',
      productAttributes: { brand: templateAttr.string() },
    });

    const result = await sut.execute({
      id: created.template.id,
      name: 'Updated Electronics Template',
      productAttributes: {
        brand: templateAttr.string(),
        model: templateAttr.string(),
      },
    });

    expect(result.template.id).toBe(created.template.id);
    expect(result.template.name).toBe('Updated Electronics Template');
    expect(result.template.productAttributes).toHaveProperty('brand');
    expect(result.template.productAttributes).toHaveProperty('model');
  });

  it('should update only provided fields', async () => {
    const created = await createTemplate.execute({
      name: 'Electronics Template',
      productAttributes: { brand: templateAttr.string() },
      variantAttributes: { color: templateAttr.string() },
    });

    const result = await sut.execute({
      id: created.template.id,
      productAttributes: {
        brand: templateAttr.string(),
        model: templateAttr.string(),
      },
    });

    expect(result.template.name).toBe('Electronics Template');
    expect(result.template.productAttributes).toHaveProperty('brand');
    expect(result.template.productAttributes).toHaveProperty('model');
    expect(result.template.variantAttributes).toHaveProperty('color');
  });

  it('should throw error if template not found', async () => {
    await expect(
      sut.execute({
        id: 'non-existent-id',
        name: 'Updated Name',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should not update with empty name', async () => {
    const created = await createTemplate.execute({
      name: 'Electronics Template',
      productAttributes: { brand: templateAttr.string() },
    });

    await expect(
      sut.execute({
        id: created.template.id,
        name: '',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not update with duplicate name', async () => {
    await createTemplate.execute({
      name: 'Electronics Template',
      productAttributes: { brand: templateAttr.string() },
    });

    const second = await createTemplate.execute({
      name: 'Clothing Template',
      productAttributes: { size: templateAttr.string() },
    });

    await expect(
      sut.execute({
        id: second.template.id,
        name: 'Electronics Template',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should update to have no attributes', async () => {
    const created = await createTemplate.execute({
      name: 'Electronics Template',
      productAttributes: { brand: templateAttr.string() },
    });

    const result = await sut.execute({
      id: created.template.id,
      productAttributes: {},
      variantAttributes: {},
      itemAttributes: {},
    });

    expect(result.template.id).toBe(created.template.id);
    expect(result.template.name).toBe('Electronics Template');
    expect(result.template.productAttributes).toEqual({});
    expect(result.template.variantAttributes).toEqual({});
    expect(result.template.itemAttributes).toEqual({});
  });

  it('should update unit of measure', async () => {
    const created = await createTemplate.execute({
      name: 'Fabric Template',
      unitOfMeasure: 'METERS',
    });

    const result = await sut.execute({
      id: created.template.id,
      unitOfMeasure: 'KILOGRAMS',
    });

    expect(result.template.unitOfMeasure).toBe('KILOGRAMS');
    expect(result.template.name).toBe('Fabric Template');
  });

  it('should throw error with invalid unit of measure', async () => {
    const created = await createTemplate.execute({
      name: 'Electronics Template',
      productAttributes: { brand: templateAttr.string() },
    });

    await expect(
      sut.execute({
        id: created.template.id,
        unitOfMeasure: 'INVALID_UNIT',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should update iconUrl', async () => {
    const created = await createTemplate.execute({
      name: 'Electronics Template',
      productAttributes: { brand: templateAttr.string() },
    });

    const result = await sut.execute({
      id: created.template.id,
      iconUrl: 'https://example.com/new-icon.svg',
    });

    expect(result.template.iconUrl).toBe('https://example.com/new-icon.svg');
  });
});
