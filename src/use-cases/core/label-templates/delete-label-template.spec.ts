import { InMemoryLabelTemplatesRepository } from '@/repositories/core/in-memory/in-memory-label-templates-repository';
import {
  makeLabelTemplate,
  makeSystemLabelTemplate,
} from '@/utils/tests/factories/core/make-label-template';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeleteLabelTemplateUseCase } from './delete-label-template';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';

let labelTemplatesRepository: InMemoryLabelTemplatesRepository;
let sut: DeleteLabelTemplateUseCase;

describe('DeleteLabelTemplateUseCase', () => {
  beforeEach(() => {
    labelTemplatesRepository = new InMemoryLabelTemplatesRepository();
    sut = new DeleteLabelTemplateUseCase(labelTemplatesRepository);
  });

  it('should delete a label template (soft delete)', async () => {
    const labelTemplate = makeLabelTemplate();
    labelTemplatesRepository.items.push(labelTemplate);

    await sut.execute({ id: labelTemplate.id.toString() });

    const foundTemplate = await labelTemplatesRepository.findById(
      labelTemplate.id,
    );
    expect(foundTemplate).toBeNull();

    const deletedTemplate = labelTemplatesRepository.items.find((t) =>
      t.id.equals(labelTemplate.id),
    );
    expect(deletedTemplate?.deletedAt).toBeDefined();
  });

  it('should not delete a system template', async () => {
    const systemTemplate = makeSystemLabelTemplate();
    labelTemplatesRepository.items.push(systemTemplate);

    await expect(
      sut.execute({ id: systemTemplate.id.toString() }),
    ).rejects.toThrow('Cannot delete system templates');
  });

  it('should throw error when template is not found', async () => {
    await expect(
      sut.execute({ id: new UniqueEntityID().toString() }),
    ).rejects.toThrow('Label template not found');
  });

  it('should throw error when trying to delete already deleted template', async () => {
    const labelTemplate = makeLabelTemplate({ deletedAt: new Date() });
    labelTemplatesRepository.items.push(labelTemplate);

    await expect(
      sut.execute({ id: labelTemplate.id.toString() }),
    ).rejects.toThrow('Label template not found');
  });
});
