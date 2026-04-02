import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { AiFavoriteQueriesRepository } from '@/repositories/ai/ai-favorite-queries-repository';
import { DeleteFavoriteUseCase } from './delete-favorite';

describe('DeleteFavoriteUseCase', () => {
  let sut: DeleteFavoriteUseCase;
  let favoritesRepository: AiFavoriteQueriesRepository;

  beforeEach(() => {
    favoritesRepository = {
      create: vi.fn(),
      findMany: vi.fn(),
      delete: vi.fn(),
      incrementUsage: vi.fn(),
    };

    sut = new DeleteFavoriteUseCase(favoritesRepository);
  });

  it('should delete a favorite query', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      favoriteId: 'fav-1',
    });

    expect(favoritesRepository.delete).toHaveBeenCalledWith(
      'fav-1',
      'tenant-1',
      'user-1',
    );
    expect(result.success).toBe(true);
  });
});
