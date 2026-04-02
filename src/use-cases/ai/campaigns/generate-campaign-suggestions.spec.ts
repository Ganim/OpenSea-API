import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { AiInsightsRepository } from '@/repositories/ai/ai-insights-repository';
import type { CampaignAnalyzer } from '@/services/ai-campaigns/campaign-analyzer';
import { GenerateCampaignSuggestionsUseCase } from './generate-campaign-suggestions';

describe('GenerateCampaignSuggestionsUseCase', () => {
  let sut: GenerateCampaignSuggestionsUseCase;
  let campaignAnalyzer: CampaignAnalyzer;
  let insightsRepository: AiInsightsRepository;

  beforeEach(() => {
    campaignAnalyzer = {
      analyze: vi.fn().mockResolvedValue({
        suggestions: [],
        aiModel: 'test-model',
      }),
    } as never;

    insightsRepository = {
      findById: vi.fn(),
      findMany: vi.fn(),
      findExistingByTypeAndEntity: vi.fn(),
      create: vi.fn().mockResolvedValue({
        id: { toString: () => 'insight-1' },
      }),
      markViewed: vi.fn(),
      markActedOn: vi.fn(),
      dismiss: vi.fn(),
    };

    sut = new GenerateCampaignSuggestionsUseCase(
      campaignAnalyzer,
      insightsRepository,
    );
  });

  it('should return empty suggestions when analyzer returns none', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
    });

    expect(result.suggestions).toEqual([]);
    expect(result.insightIds).toEqual([]);
    expect(result.aiModel).toBe('test-model');
  });

  it('should create insights for each suggestion', async () => {
    vi.mocked(campaignAnalyzer.analyze).mockResolvedValue({
      suggestions: [
        {
          type: 'LIQUIDATION',
          title: 'Liquidação de Verão',
          description: 'Campanha de liquidação',
          targetProducts: ['prod-1'],
          suggestedDiscount: 20,
          estimatedImpact: { revenue: 5000 },
          suggestedActions: [],
        },
        {
          type: 'CROSS_SELL',
          title: 'Venda Cruzada',
          description: 'Campanha cross-sell',
          targetProducts: ['prod-2'],
          suggestedDiscount: 10,
          estimatedImpact: { revenue: 3000 },
          suggestedActions: [],
        },
      ],
      aiModel: 'claude-3',
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
    });

    expect(result.suggestions).toHaveLength(2);
    expect(result.insightIds).toHaveLength(2);
    expect(insightsRepository.create).toHaveBeenCalledTimes(2);

    // LIQUIDATION => OPPORTUNITY + HIGH
    expect(insightsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'OPPORTUNITY',
        priority: 'HIGH',
        title: 'Liquidação de Verão',
      }),
    );
  });
});
