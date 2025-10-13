import { InMemoryTemplatesRepository } from '@/repositories/stock/in-memory/in-memory-templates-repository';
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
      name: 'Electronics Template',
      productAttributes: { brand: 'string' },
    });

    await createTemplate.execute({
      name: 'Clothing Template',
      productAttributes: { size: 'string' },
    });

    const result = await sut.execute();

    expect(result.templates).toHaveLength(2);
    expect(result.templates[0].name).toBe('Electronics Template');
    expect(result.templates[1].name).toBe('Clothing Template');
  });

  it('should return empty array when no templates exist', async () => {
    const result = await sut.execute();

    expect(result.templates).toHaveLength(0);
  });
});
