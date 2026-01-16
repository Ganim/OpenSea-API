import { InMemoryLabelTemplatesRepository } from '@/repositories/core/in-memory/in-memory-label-templates-repository';
import { makeLabelTemplate } from '@/utils/tests/factories/core/make-label-template';
import { beforeEach, describe, expect, it } from 'vitest';
import { GenerateLabelTemplateThumbnailUseCase } from './generate-label-template-thumbnail';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';

let labelTemplatesRepository: InMemoryLabelTemplatesRepository;
let sut: GenerateLabelTemplateThumbnailUseCase;

describe('GenerateLabelTemplateThumbnailUseCase', () => {
  beforeEach(() => {
    labelTemplatesRepository = new InMemoryLabelTemplatesRepository();
    sut = new GenerateLabelTemplateThumbnailUseCase(labelTemplatesRepository);
  });

  it('should generate a thumbnail URL for a label template', async () => {
    const labelTemplate = makeLabelTemplate();
    labelTemplatesRepository.items.push(labelTemplate);

    const result = await sut.execute({ id: labelTemplate.id.toString() });

    expect(result.thumbnailUrl).toBeDefined();
    expect(result.thumbnailUrl).toContain(labelTemplate.id.toString());
  });

  it('should update the template with the new thumbnail URL', async () => {
    const labelTemplate = makeLabelTemplate({ thumbnailUrl: undefined });
    labelTemplatesRepository.items.push(labelTemplate);

    await sut.execute({ id: labelTemplate.id.toString() });

    const updatedTemplate = await labelTemplatesRepository.findById(
      labelTemplate.id,
    );
    expect(updatedTemplate?.thumbnailUrl).toBeDefined();
  });

  it('should throw error when template is not found', async () => {
    await expect(
      sut.execute({ id: new UniqueEntityID().toString() }),
    ).rejects.toThrow('Label template not found');
  });
});
