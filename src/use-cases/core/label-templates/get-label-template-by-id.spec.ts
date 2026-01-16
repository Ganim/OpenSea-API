import { InMemoryLabelTemplatesRepository } from '@/repositories/core/in-memory/in-memory-label-templates-repository';
import { makeLabelTemplate } from '@/utils/tests/factories/core/make-label-template';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetLabelTemplateByIdUseCase } from './get-label-template-by-id';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';

let labelTemplatesRepository: InMemoryLabelTemplatesRepository;
let sut: GetLabelTemplateByIdUseCase;

describe('GetLabelTemplateByIdUseCase', () => {
  beforeEach(() => {
    labelTemplatesRepository = new InMemoryLabelTemplatesRepository();
    sut = new GetLabelTemplateByIdUseCase(labelTemplatesRepository);
  });

  it('should get a label template by id', async () => {
    const labelTemplate = makeLabelTemplate({ name: 'Etiqueta Teste' });
    labelTemplatesRepository.items.push(labelTemplate);

    const result = await sut.execute({ id: labelTemplate.id.toString() });

    expect(result.template).toBeDefined();
    expect(result.template.id).toBe(labelTemplate.id.toString());
    expect(result.template.name).toBe('Etiqueta Teste');
  });

  it('should throw error when label template is not found', async () => {
    await expect(
      sut.execute({ id: new UniqueEntityID().toString() }),
    ).rejects.toThrow('Label template not found');
  });

  it('should not return deleted label template', async () => {
    const labelTemplate = makeLabelTemplate({ deletedAt: new Date() });
    labelTemplatesRepository.items.push(labelTemplate);

    await expect(
      sut.execute({ id: labelTemplate.id.toString() }),
    ).rejects.toThrow('Label template not found');
  });
});
