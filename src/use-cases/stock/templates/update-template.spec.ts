import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryTemplatesRepository } from '@/repositories/stock/in-memory/in-memory-templates-repository';
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
      productAttributes: { brand: 'string' },
    });

    const result = await sut.execute({
      id: created.template.id,
      name: 'Updated Electronics Template',
      productAttributes: { brand: 'string', model: 'string' },
    });

    expect(result.template).toEqual(
      expect.objectContaining({
        id: created.template.id,
        name: 'Updated Electronics Template',
        productAttributes: { brand: 'string', model: 'string' },
      }),
    );
  });

  it('should update only provided fields', async () => {
    const created = await createTemplate.execute({
      name: 'Electronics Template',
      productAttributes: { brand: 'string' },
      variantAttributes: { color: 'string' },
    });

    const result = await sut.execute({
      id: created.template.id,
      productAttributes: { brand: 'string', model: 'string' },
    });

    expect(result.template.name).toBe('Electronics Template');
    expect(result.template.productAttributes).toEqual({
      brand: 'string',
      model: 'string',
    });
    expect(result.template.variantAttributes).toEqual({ color: 'string' });
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
      productAttributes: { brand: 'string' },
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
      productAttributes: { brand: 'string' },
    });

    const second = await createTemplate.execute({
      name: 'Clothing Template',
      productAttributes: { size: 'string' },
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
      productAttributes: { brand: 'string' },
    });

    const result = await sut.execute({
      id: created.template.id,
      productAttributes: {},
      variantAttributes: {},
      itemAttributes: {},
    });

    expect(result.template).toMatchObject({
      id: created.template.id,
      name: 'Electronics Template',
      productAttributes: {},
      variantAttributes: {},
      itemAttributes: {},
    });
  });
});
