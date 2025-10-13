import { Tag } from '@/entities/stock/tag';
import { InMemoryTagsRepository } from '@/repositories/stock/in-memory/in-memory-tags-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListTagsUseCase } from './list-tags';

let tagsRepository: InMemoryTagsRepository;
let sut: ListTagsUseCase;

describe('ListTagsUseCase', () => {
  beforeEach(() => {
    tagsRepository = new InMemoryTagsRepository();
    sut = new ListTagsUseCase(tagsRepository);
  });

  it('should list all tags', async () => {
    const tag1 = Tag.create({
      name: 'Electronics',
      slug: 'electronics',
      color: '#FF5733',
      description: 'Electronic items',
    });

    const tag2 = Tag.create({
      name: 'Clothing',
      slug: 'clothing',
      color: '#33FF57',
      description: 'Clothing items',
    });

    await tagsRepository.create({
      name: tag1.name,
      slug: tag1.slug,
      color: tag1.color ?? undefined,
      description: tag1.description ?? undefined,
    });

    await tagsRepository.create({
      name: tag2.name,
      slug: tag2.slug,
      color: tag2.color ?? undefined,
      description: tag2.description ?? undefined,
    });

    const result = await sut.execute();

    expect(result.tags).toHaveLength(2);
    expect(result.tags[0]).toEqual(
      expect.objectContaining({
        name: 'Electronics',
        slug: 'electronics',
      }),
    );
    expect(result.tags[1]).toEqual(
      expect.objectContaining({
        name: 'Clothing',
        slug: 'clothing',
      }),
    );
  });

  it('should return empty array when there are no tags', async () => {
    const result = await sut.execute();

    expect(result.tags).toHaveLength(0);
  });
});
