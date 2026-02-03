import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryTagsRepository } from '@/repositories/stock/in-memory/in-memory-tags-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateTagUseCase } from './create-tag';
import { GetTagByIdUseCase } from './get-tag-by-id';

let tagsRepository: InMemoryTagsRepository;
let createTagUseCase: CreateTagUseCase;
let sut: GetTagByIdUseCase;

describe('GetTagByIdUseCase', () => {
  beforeEach(() => {
    tagsRepository = new InMemoryTagsRepository();
    createTagUseCase = new CreateTagUseCase(tagsRepository);
    sut = new GetTagByIdUseCase(tagsRepository);
  });

  it('should get a tag by id', async () => {
    const { tag: createdTag } = await createTagUseCase.execute({
      tenantId: 'tenant-1',
      name: 'Electronics',
      slug: 'electronics',
      color: '#FF5733',
      description: 'Electronic items',
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      id: createdTag.id,
    });

    expect(result.tag).toEqual(createdTag);
  });

  it('should throw error when tag does not exist', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        id: 'non-existent-id',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
