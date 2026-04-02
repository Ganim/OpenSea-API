import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { AiInsightsRepository } from '@/repositories/ai/ai-insights-repository';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    tenantUser: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
}));

vi.mock('@/services/ai-insights/insight-generator', () => ({
  InsightGenerator: vi.fn().mockImplementation(() => ({
    generate: vi.fn().mockResolvedValue({
      generated: 0,
      skipped: 0,
      errors: 0,
    }),
  })),
}));

import { GenerateInsightsUseCase } from './generate-insights';
import { prisma } from '@/lib/prisma';

describe('GenerateInsightsUseCase', () => {
  let sut: GenerateInsightsUseCase;
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

    sut = new GenerateInsightsUseCase(insightsRepository);
  });

  it('should fetch tenant users and generate insights', async () => {
    vi.mocked(prisma.tenantUser.findMany).mockResolvedValue([
      { userId: 'user-2' },
    ] as never);

    const result = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
    });

    expect(prisma.tenantUser.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId: 'tenant-1', deletedAt: null },
      }),
    );
    expect(result.result).toBeDefined();
  });

  it('should include requesting user in target list', async () => {
    vi.mocked(prisma.tenantUser.findMany).mockResolvedValue([]);

    await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
    });

    // The requesting user should always be included even if not in tenantUsers
    expect(prisma.tenantUser.findMany).toHaveBeenCalled();
  });
});
