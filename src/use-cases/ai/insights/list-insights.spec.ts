import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { AiInsightsRepository } from '@/repositories/ai/ai-insights-repository';
import { ListInsightsUseCase } from './list-insights';

describe('ListInsightsUseCase', () => {
  let sut: ListInsightsUseCase;
  let insightsRepository: AiInsightsRepository;

  beforeEach(() => {
    insightsRepository = {
      findById: vi.fn(),
      findMany: vi.fn().mockResolvedValue({ insights: [], total: 0 }),
      findExistingByTypeAndEntity: vi.fn(),
      create: vi.fn(),
      markViewed: vi.fn(),
      markActedOn: vi.fn(),
      dismiss: vi.fn(),
    };

    sut = new ListInsightsUseCase(insightsRepository);
  });

  it('should list insights with default pagination', async () => {
    const mockInsight = {
      id: { toString: () => 'ins-1' },
      tenantId: { toString: () => 'tenant-1' },
      type: 'ALERT',
      priority: 'HIGH',
      title: 'Low stock alert',
      content: 'Product X is running low',
      renderData: null,
      module: 'stock',
      relatedEntityType: 'product',
      relatedEntityId: 'prod-1',
      status: 'NEW',
      actionUrl: '/stock/products/prod-1',
      suggestedAction: 'Restock product',
      expiresAt: null,
      viewedAt: null,
      actedOnAt: null,
      dismissedAt: null,
      createdAt: new Date(),
    };

    vi.mocked(insightsRepository.findMany).mockResolvedValue({
      insights: [mockInsight] as never,
      total: 1,
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
    });

    expect(result.insights).toHaveLength(1);
    expect(result.insights[0].id).toBe('ins-1');
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

    expect(insightsRepository.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 100 }),
    );
  });

  it('should pass all filters', async () => {
    await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      status: 'NEW',
      type: 'ALERT',
      priority: 'HIGH',
      module: 'stock',
    });

    expect(insightsRepository.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'NEW',
        type: 'ALERT',
        priority: 'HIGH',
        module: 'stock',
      }),
    );
  });
});
