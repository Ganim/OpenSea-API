import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { AiFavoriteQueriesRepository } from '@/repositories/ai/ai-favorite-queries-repository';
import { ListFavoritesUseCase } from './list-favorites';

describe('ListFavoritesUseCase', () => {
  let sut: ListFavoritesUseCase;
  let favoritesRepository: AiFavoriteQueriesRepository;

  beforeEach(() => {
    favoritesRepository = {
      create: vi.fn(),
      findMany: vi.fn().mockResolvedValue({ favorites: [], total: 0 }),
      delete: vi.fn(),
      incrementUsage: vi.fn(),
    };

    sut = new ListFavoritesUseCase(favoritesRepository);
  });

  it('should list favorites with default pagination', async () => {
    vi.mocked(favoritesRepository.findMany).mockResolvedValue({
      favorites: [{ id: 'fav-1', query: 'test' }] as never,
      total: 1,
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
    });

    expect(result.favorites).toHaveLength(1);
    expect(result.meta).toEqual({
      total: 1,
      page: 1,
      limit: 20,
      pages: 1,
    });
  });

  it('should cap limit at 100', async () => {
    await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      limit: 500,
    });

    expect(favoritesRepository.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 100 }),
    );
  });

  it('should pass category filter', async () => {
    await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      category: 'finance',
    });

    expect(favoritesRepository.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'finance' }),
    );
  });
});
