import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryTemplatesRepository } from '@/repositories/stock/in-memory/in-memory-templates-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateTemplateUseCase } from './create-template';
import { GetTemplateByIdUseCase } from './get-template-by-id';

let templatesRepository: InMemoryTemplatesRepository;
let sut: GetTemplateByIdUseCase;
let createTemplate: CreateTemplateUseCase;

describe('GetTemplateByIdUseCase', () => {
  beforeEach(() => {
    templatesRepository = new InMemoryTemplatesRepository();
    sut = new GetTemplateByIdUseCase(templatesRepository);
    createTemplate = new CreateTemplateUseCase(templatesRepository);
  });

  it('should get a template by id', async () => {
    const created = await createTemplate.execute({
      name: 'Electronics Template',
      productAttributes: { brand: 'string', model: 'string' },
    });

    const result = await sut.execute({ id: created.template.id });

    expect(result.template).toEqual(
      expect.objectContaining({
        id: created.template.id,
        name: 'Electronics Template',
        productAttributes: { brand: 'string', model: 'string' },
      }),
    );
  });

  it('should throw error if template not found', async () => {
    await expect(sut.execute({ id: 'non-existent-id' })).rejects.toThrow(
      ResourceNotFoundError,
    );
  });
});
