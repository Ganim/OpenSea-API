import { InMemoryTemplatesRepository } from '@/repositories/stock/in-memory/in-memory-templates-repository';
import { templateAttr } from '@/utils/tests/factories/stock/make-template';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateTemplateUseCase } from './create-template';
import { ListTemplatesUseCase } from './list-templates';

let templatesRepository: InMemoryTemplatesRepository;
let sut: ListTemplatesUseCase;
let createTemplate: CreateTemplateUseCase;

describe('ListTemplatesUseCase', () => {
  beforeEach(() => {
    templatesRepository = new InMemoryTemplatesRepository();
    sut = new ListTemplatesUseCase(templatesRepository);
    createTemplate = new CreateTemplateUseCase(templatesRepository);
  });

  it('should list all templates', async () => {
    await createTemplate.execute({
      tenantId: 'tenant-1',
      name: 'Electronics Template',
      productAttributes: { brand: templateAttr.string() },
    });

    await createTemplate.execute({
      tenantId: 'tenant-1',
      name: 'Clothing Template',
      productAttributes: { size: templateAttr.string() },
    });

    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.templates).toHaveLength(2);
    expect(result.templates[0].name).toBe('Electronics Template');
    expect(result.templates[1].name).toBe('Clothing Template');
  });

  it('should return empty array when no templates exist', async () => {
    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.templates).toHaveLength(0);
  });
});
