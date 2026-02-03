import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryTemplatesRepository } from '@/repositories/stock/in-memory/in-memory-templates-repository';
import { templateAttr } from '@/utils/tests/factories/stock/make-template';
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
      tenantId: 'tenant-1',
      name: 'Electronics Template',
      productAttributes: {
        brand: templateAttr.string(),
        model: templateAttr.string(),
      },
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      id: created.template.id,
    });

    expect(result.template.id).toBe(created.template.id);
    expect(result.template.name).toBe('Electronics Template');
    expect(result.template.productAttributes).toHaveProperty('brand');
    expect(result.template.productAttributes).toHaveProperty('model');
  });

  it('should throw error if template not found', async () => {
    await expect(
      sut.execute({ tenantId: 'tenant-1', id: 'non-existent-id' }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
