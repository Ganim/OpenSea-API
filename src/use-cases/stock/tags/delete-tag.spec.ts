import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryTagsRepository } from '@/repositories/stock/in-memory/in-memory-tags-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateTagUseCase } from './create-tag';
import { DeleteTagUseCase } from './delete-tag';

let tagsRepository: InMemoryTagsRepository;
let createTagUseCase: CreateTagUseCase;
let sut: DeleteTagUseCase;

describe('DeleteTagUseCase', () => {
  beforeEach(() => {
    tagsRepository = new InMemoryTagsRepository();
    createTagUseCase = new CreateTagUseCase(tagsRepository);
    sut = new DeleteTagUseCase(tagsRepository);
  });

  it('should delete a tag', async () => {
    const { tag: createdTag } = await createTagUseCase.execute({
      name: 'Electronics',
      slug: 'electronics',
    });

    await sut.execute({
      id: createdTag.id,
    });

    const deletedTag = await tagsRepository.findById(
      new UniqueEntityID(createdTag.id),
    );
    expect(deletedTag).toBeNull();
  });

  it('should throw error when tag does not exist', async () => {
    await expect(
      sut.execute({
        id: 'non-existent-id',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
