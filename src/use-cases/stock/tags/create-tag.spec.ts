import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { InMemoryTagsRepository } from '@/repositories/stock/in-memory/in-memory-tags-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateTagUseCase } from './create-tag';

let tagsRepository: InMemoryTagsRepository;
let sut: CreateTagUseCase;

describe('CreateTagUseCase', () => {
  beforeEach(() => {
    tagsRepository = new InMemoryTagsRepository();
    sut = new CreateTagUseCase(tagsRepository);
  });

  it('should create a tag', async () => {
    const result = await sut.execute({
      name: 'Electronics',
      slug: 'electronics',
      color: '#FF5733',
      description: 'Electronic items',
    });

    expect(result.tag).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        name: 'Electronics',
        slug: 'electronics',
        color: '#FF5733',
        description: 'Electronic items',
      }),
    );
  });

  it('should create a tag without slug (auto-generate)', async () => {
    const result = await sut.execute({
      name: 'Electronics & Gadgets',
    });

    expect(result.tag.slug).toBe('electronics-gadgets');
  });

  it('should create a tag without color', async () => {
    const result = await sut.execute({
      name: 'Electronics',
    });

    expect(result.tag.color).toBeNull();
  });

  it('should create a tag without description', async () => {
    const result = await sut.execute({
      name: 'Electronics',
    });

    expect(result.tag.description).toBeNull();
  });

  it('should not create a tag with empty name', async () => {
    await expect(
      sut.execute({
        name: '',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not create a tag with name longer than 100 characters', async () => {
    await expect(
      sut.execute({
        name: 'a'.repeat(101),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not create a tag with duplicate name', async () => {
    await sut.execute({
      name: 'Electronics',
    });

    await expect(
      sut.execute({
        name: 'Electronics',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not create a tag with duplicate slug', async () => {
    await sut.execute({
      name: 'Electronics',
      slug: 'electronics',
    });

    await expect(
      sut.execute({
        name: 'Electronics 2',
        slug: 'electronics',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not create a tag with invalid color format', async () => {
    await expect(
      sut.execute({
        name: 'Electronics',
        color: 'red',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not create a tag with slug longer than 100 characters', async () => {
    await expect(
      sut.execute({
        name: 'Electronics',
        slug: 'a'.repeat(101),
      }),
    ).rejects.toThrow(BadRequestError);
  });
});
