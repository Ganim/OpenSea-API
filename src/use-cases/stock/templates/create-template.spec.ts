import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { InMemoryTemplatesRepository } from '@/repositories/stock/in-memory/in-memory-templates-repository';
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
      name: 'Electronics Template',
      productAttributes: {
        brand: 'string',
        model: 'string',
        warranty: 'number',
      },
      variantAttributes: {
        color: 'string',
        storage: 'string',
      },
      itemAttributes: {
        serialNumber: 'string',
        condition: 'string',
      },
    });

    expect(result.template).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        name: 'Electronics Template',
        productAttributes: {
          brand: 'string',
          model: 'string',
          warranty: 'number',
        },
        variantAttributes: {
          color: 'string',
          storage: 'string',
        },
        itemAttributes: {
          serialNumber: 'string',
          condition: 'string',
        },
      }),
    );
  });

  it('should create a template with only product attributes', async () => {
    const result = await sut.execute({
      name: 'Simple Template',
      productAttributes: {
        category: 'string',
      },
    });

    expect(result.template.name).toBe('Simple Template');
    expect(result.template.productAttributes).toEqual({ category: 'string' });
    expect(result.template.variantAttributes).toEqual({});
    expect(result.template.itemAttributes).toEqual({});
  });

  it('should not create a template with empty name', async () => {
    await expect(
      sut.execute({
        name: '',
        productAttributes: { test: 'string' },
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not create a template with name longer than 200 characters', async () => {
    await expect(
      sut.execute({
        name: 'a'.repeat(201),
        productAttributes: { test: 'string' },
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not create a template with duplicate name', async () => {
    await sut.execute({
      name: 'Electronics Template',
      productAttributes: { brand: 'string' },
    });

    await expect(
      sut.execute({
        name: 'Electronics Template',
        productAttributes: { model: 'string' },
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should create a template without any attributes', async () => {
    const result = await sut.execute({
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
});
