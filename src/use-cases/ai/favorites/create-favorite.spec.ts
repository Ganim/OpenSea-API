import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { AiFavoriteQueriesRepository } from '@/repositories/ai/ai-favorite-queries-repository';
import { CreateFavoriteUseCase } from './create-favorite';

describe('CreateFavoriteUseCase', () => {
  let sut: CreateFavoriteUseCase;
  let favoritesRepository: AiFavoriteQueriesRepository;

  beforeEach(() => {
    favoritesRepository = {
      create: vi.fn().mockResolvedValue({
        id: 'fav-1',
        tenantId: 'tenant-1',
        userId: 'user-1',
        query: 'quanto gastei?',
        shortcut: '/gastos',
        category: 'finance',
        usageCount: 0,
        lastUsedAt: null,
        createdAt: new Date(),
      }),
      findMany: vi.fn(),
      delete: vi.fn(),
      incrementUsage: vi.fn(),
    };

    sut = new CreateFavoriteUseCase(favoritesRepository);
  });

  it('should create a favorite query', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      query: 'quanto gastei?',
      shortcut: '/gastos',
      category: 'finance',
    });

    expect(favoritesRepository.create).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      userId: 'user-1',
      query: 'quanto gastei?',
      shortcut: '/gastos',
      category: 'finance',
    });
    expect(result.favorite.id).toBe('fav-1');
  });

  it('should create a favorite without optional fields', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      query: 'listar produtos',
    });

    expect(favoritesRepository.create).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      userId: 'user-1',
      query: 'listar produtos',
      shortcut: undefined,
      category: undefined,
    });
    expect(result.favorite).toBeDefined();
  });
});
