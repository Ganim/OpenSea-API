import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { AiInsightsRepository } from '@/repositories/ai/ai-insights-repository';
import type { ToolExecutor } from '@/services/ai-tools/tool-executor';
import { ApplyCampaignUseCase } from './apply-campaign';

describe('ApplyCampaignUseCase', () => {
  let sut: ApplyCampaignUseCase;
  let insightsRepository: AiInsightsRepository;
  let toolExecutor: ToolExecutor;

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

    toolExecutor = {
      execute: vi.fn().mockResolvedValue({
        content: JSON.stringify({ success: true }),
        isError: false,
      }),
      executeDirect: vi.fn(),
    } as never;

    sut = new ApplyCampaignUseCase(insightsRepository, toolExecutor);
  });

  it('should throw if insight not found', async () => {
    vi.mocked(insightsRepository.findById).mockResolvedValue(null);

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        insightId: 'insight-1',
      }),
    ).rejects.toThrow('Insight não encontrado.');
  });

  it('should throw if insight already acted on', async () => {
    vi.mocked(insightsRepository.findById).mockResolvedValue({
      status: 'ACTED_ON',
      renderData: {},
    } as never);

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        insightId: 'insight-1',
      }),
    ).rejects.toThrow('Esta campanha já foi aplicada.');
  });

  it('should throw if insight was dismissed', async () => {
    vi.mocked(insightsRepository.findById).mockResolvedValue({
      status: 'DISMISSED',
      renderData: {},
    } as never);

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        insightId: 'insight-1',
      }),
    ).rejects.toThrow('Esta campanha foi descartada.');
  });

  it('should throw if insight has no suggested actions', async () => {
    vi.mocked(insightsRepository.findById).mockResolvedValue({
      status: 'NEW',
      renderData: null,
    } as never);

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        insightId: 'insight-1',
      }),
    ).rejects.toThrow('Este insight não possui ações sugeridas para aplicar.');
  });

  it('should execute actions and mark insight as acted on', async () => {
    vi.mocked(insightsRepository.findById).mockResolvedValue({
      status: 'NEW',
      renderData: {
        suggestedActions: [
          {
            tool: 'stock_create_product',
            description: 'Create product',
            args: { name: 'Test' },
          },
        ],
      },
    } as never);

    const result = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      insightId: 'insight-1',
    });

    expect(result.success).toBe(true);
    expect(result.executedActions).toHaveLength(1);
    expect(insightsRepository.markActedOn).toHaveBeenCalledWith(
      'insight-1',
      'tenant-1',
    );
  });

  it('should handle tool execution error gracefully', async () => {
    vi.mocked(insightsRepository.findById).mockResolvedValue({
      status: 'NEW',
      renderData: {
        suggestedActions: [
          {
            tool: 'stock_create_product',
            description: 'Create product',
            args: { name: 'Test' },
          },
        ],
      },
    } as never);

    vi.mocked(toolExecutor.execute).mockRejectedValue(new Error('Tool failed'));

    const result = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      insightId: 'insight-1',
    });

    expect(result.success).toBe(false);
    expect(result.executedActions[0].error).toBe('Tool failed');
  });
});
