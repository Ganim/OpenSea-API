import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { AiInsightsRepository } from '@/repositories/ai/ai-insights-repository';
import { ViewInsightUseCase } from './view-insight';

describe('ViewInsightUseCase', () => {
  let sut: ViewInsightUseCase;
  let insightsRepository: AiInsightsRepository;

  beforeEach(() => {
    insightsRepository = {
      findById: vi.fn(),
      findMany: vi.fn(),
      findExistingByTypeAndEntity: vi.fn(),
      create: vi.fn(),
      markViewed: vi.fn(),
      markActedOn: vi.fn(),
      dismiss: vi.fn(),
    };

    sut = new ViewInsightUseCase(insightsRepository);
  });

  it('should throw if insight not found', async () => {
    vi.mocked(insightsRepository.findById).mockResolvedValue(null);

    await expect(
      sut.execute({ tenantId: 'tenant-1', insightId: 'insight-1' }),
    ).rejects.toThrow('Insight not found');
  });

  it('should mark insight as viewed', async () => {
    vi.mocked(insightsRepository.findById).mockResolvedValue({
      id: { toString: () => 'insight-1' },
      status: 'NEW',
    } as never);

    const result = await sut.execute({
      tenantId: 'tenant-1',
      insightId: 'insight-1',
    });

    expect(insightsRepository.markViewed).toHaveBeenCalledWith(
      'insight-1',
      'tenant-1',
    );
    expect(result.success).toBe(true);
  });
});
