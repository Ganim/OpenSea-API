import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryTemplatesRepository } from '@/repositories/stock/in-memory/in-memory-templates-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateTemplateUseCase } from './create-template';
import { DeleteTemplateUseCase } from './delete-template';
import { GetTemplateByIdUseCase } from './get-template-by-id';

let templatesRepository: InMemoryTemplatesRepository;
let sut: DeleteTemplateUseCase;
let createTemplate: CreateTemplateUseCase;
let getTemplate: GetTemplateByIdUseCase;

describe('DeleteTemplateUseCase', () => {
  beforeEach(() => {
    templatesRepository = new InMemoryTemplatesRepository();
    sut = new DeleteTemplateUseCase(templatesRepository);
    createTemplate = new CreateTemplateUseCase(templatesRepository);
    getTemplate = new GetTemplateByIdUseCase(templatesRepository);
  });

  it('should delete a template', async () => {
    const created = await createTemplate.execute({
      name: 'Electronics Template',
      productAttributes: { brand: 'string' },
    });

    await sut.execute({ id: created.template.id });

    await expect(
      getTemplate.execute({ id: created.template.id }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should throw error if template not found', async () => {
    await expect(sut.execute({ id: 'non-existent-id' })).rejects.toThrow(
      ResourceNotFoundError,
    );
  });
});
