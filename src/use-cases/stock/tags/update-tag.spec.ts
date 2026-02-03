import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryTagsRepository } from '@/repositories/stock/in-memory/in-memory-tags-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateTagUseCase } from './create-tag';
import { UpdateTagUseCase } from './update-tag';

let tagsRepository: InMemoryTagsRepository;
let createTagUseCase: CreateTagUseCase;
let sut: UpdateTagUseCase;

describe('UpdateTagUseCase', () => {
  beforeEach(() => {
    tagsRepository = new InMemoryTagsRepository();
    createTagUseCase = new CreateTagUseCase(tagsRepository);
    sut = new UpdateTagUseCase(tagsRepository);
  });

  it('should update a tag', async () => {
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
      name: 'Electronics & Gadgets',
      slug: 'electronics-gadgets',
      color: '#33FF57',
      description: 'Electronic items and gadgets',
    });

    expect(result.tag).toEqual(
      expect.objectContaining({
        name: 'Electronics & Gadgets',
        slug: 'electronics-gadgets',
        color: '#33FF57',
        description: 'Electronic items and gadgets',
      }),
    );
  });

  it('should update only name', async () => {
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
      name: 'Electronics & Gadgets',
    });

    expect(result.tag.name).toBe('Electronics & Gadgets');
    expect(result.tag.slug).toBe('electronics');
    expect(result.tag.color).toBe('#FF5733');
  });

  it('should throw error when updating with empty name', async () => {
    const { tag: createdTag } = await createTagUseCase.execute({
      tenantId: 'tenant-1',
      name: 'Electronics',
      slug: 'electronics',
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        id: createdTag.id,
        name: '',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw error when updating with duplicate name', async () => {
    await createTagUseCase.execute({
      tenantId: 'tenant-1',
      name: 'Electronics',
      slug: 'electronics',
    });

    const { tag: tag2 } = await createTagUseCase.execute({
      tenantId: 'tenant-1',
      name: 'Clothing',
      slug: 'clothing',
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        id: tag2.id,
        name: 'Electronics',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw error when updating with duplicate slug', async () => {
    await createTagUseCase.execute({
      tenantId: 'tenant-1',
      name: 'Electronics',
      slug: 'electronics',
    });

    const { tag: tag2 } = await createTagUseCase.execute({
      tenantId: 'tenant-1',
      name: 'Clothing',
      slug: 'clothing',
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        id: tag2.id,
        slug: 'electronics',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw error when updating with invalid color', async () => {
    const { tag: createdTag } = await createTagUseCase.execute({
      tenantId: 'tenant-1',
      name: 'Electronics',
      slug: 'electronics',
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        id: createdTag.id,
        color: 'red',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw error when tag does not exist', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        id: 'non-existent-id',
        name: 'New Name',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should throw error when updating with name longer than 100 characters', async () => {
    const { tag: createdTag } = await createTagUseCase.execute({
      tenantId: 'tenant-1',
      name: 'Electronics',
      slug: 'electronics',
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        id: createdTag.id,
        name: 'a'.repeat(101),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw error when updating with slug longer than 100 characters', async () => {
    const { tag: createdTag } = await createTagUseCase.execute({
      tenantId: 'tenant-1',
      name: 'Electronics',
      slug: 'electronics',
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        id: createdTag.id,
        slug: 'a'.repeat(101),
      }),
    ).rejects.toThrow(BadRequestError);
  });
});
