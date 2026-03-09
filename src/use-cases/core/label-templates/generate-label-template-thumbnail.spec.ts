import { InMemoryLabelTemplatesRepository } from '@/repositories/core/in-memory/in-memory-label-templates-repository';
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

  it('should throw error when template is not found', async () => {
    await expect(
      sut.execute({
        id: new UniqueEntityID().toString(),
        tenantId: new UniqueEntityID().toString(),
        file: {
          buffer: Buffer.from('fake-image'),
          filename: 'thumbnail.png',
          mimetype: 'image/png',
        },
        uploadedBy: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow('Label template not found');
  });
});
