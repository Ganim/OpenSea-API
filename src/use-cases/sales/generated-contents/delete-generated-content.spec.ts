import { describe, it, expect, beforeEach } from 'vitest';
import { DeleteGeneratedContentUseCase } from './delete-generated-content';
import { InMemoryGeneratedContentsRepository } from '@/repositories/sales/in-memory/in-memory-generated-contents-repository';
import { GeneratedContent } from '@/entities/sales/generated-content';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';

let contentsRepository: InMemoryGeneratedContentsRepository;
let sut: DeleteGeneratedContentUseCase;

describe('DeleteGeneratedContentUseCase', () => {
  beforeEach(() => {
    contentsRepository = new InMemoryGeneratedContentsRepository();
    sut = new DeleteGeneratedContentUseCase(contentsRepository);
  });

  it('should soft-delete a content', async () => {
    const content = GeneratedContent.create({
      tenantId: new UniqueEntityID('tenant-1'),
      type: 'SOCIAL_POST',
      title: 'Test',
    });
    contentsRepository.items.push(content);

    await sut.execute({
      contentId: content.id.toString(),
      tenantId: 'tenant-1',
    });

    expect(contentsRepository.items[0]!.isDeleted).toBe(true);
  });

  it('should throw when content not found', async () => {
    await expect(
      sut.execute({ contentId: 'non-existent', tenantId: 'tenant-1' }),
    ).rejects.toThrow('Content not found');
  });
});
