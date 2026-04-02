import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    aiActionLog: {
      create: vi.fn(),
    },
  },
}));

import type { AiRouter } from '@/services/ai-provider/ai-router';
import type { ToolRegistry } from '@/services/ai-tools/tool-registry';
import type { ToolExecutor } from '@/services/ai-tools/tool-executor';
import { SetupWizardUseCase } from './setup-wizard';

describe('SetupWizardUseCase', () => {
  let sut: SetupWizardUseCase;
  let aiRouter: AiRouter;
  let toolRegistry: ToolRegistry;
  let toolExecutor: ToolExecutor;

  beforeEach(() => {
    aiRouter = {
      complete: vi.fn(),
      completeWithTools: vi.fn(),
      getAvailableTiers: vi.fn(),
    } as never;

    toolRegistry = {
      getToolsForUser: vi.fn().mockReturnValue([
        {
          name: 'stock_create_category',
          description: 'Create category',
          module: 'stock',
        },
      ]),
      getAllTools: vi.fn().mockReturnValue([]),
      getTool: vi.fn().mockReturnValue(null),
    } as never;

    toolExecutor = {
      execute: vi.fn().mockResolvedValue({
        content: JSON.stringify({ id: 'cat-1', name: 'Eletrônicos' }),
        isError: false,
      }),
      executeDirect: vi.fn(),
    } as never;

    sut = new SetupWizardUseCase(aiRouter, toolRegistry, toolExecutor);
  });

  it('should return failure when AI generates empty plan', async () => {
    vi.mocked(aiRouter.complete).mockResolvedValue({
      content: '[]',
      model: 'test',
      tokensInput: 10,
      tokensOutput: 10,
      latencyMs: 50,
      estimatedCost: 0.001,
      tier: 3,
    } as never);

    const result = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      userPermissions: ['stock.categories.register'],
      businessDescription: 'Loja de eletrônicos',
    });

    expect(result.success).toBe(false);
    expect(result.plan).toEqual([]);
  });

  it('should generate and execute a plan successfully', async () => {
    vi.mocked(aiRouter.complete).mockResolvedValue({
      content: JSON.stringify([
        {
          order: 1,
          module: 'stock',
          action: 'stock_create_category',
          description: 'Categoria de eletrônicos',
          args: { name: 'Eletrônicos' },
        },
      ]),
      model: 'test',
      tokensInput: 10,
      tokensOutput: 10,
      latencyMs: 50,
      estimatedCost: 0.001,
      tier: 3,
    } as never);

    const result = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      userPermissions: ['stock.categories.register'],
      businessDescription: 'Loja de eletrônicos',
    });

    expect(result.success).toBe(true);
    expect(result.plan).toHaveLength(1);
    expect(result.executed).toHaveLength(1);
    expect(result.summary).toContain('Loja de eletrônicos');
  });

  it('should handle invalid AI response gracefully', async () => {
    vi.mocked(aiRouter.complete).mockResolvedValue({
      content: 'not valid json at all',
      model: 'test',
      tokensInput: 10,
      tokensOutput: 10,
      latencyMs: 50,
      estimatedCost: 0.001,
      tier: 3,
    } as never);

    const result = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      userPermissions: [],
      businessDescription: 'Restaurante',
    });

    expect(result.success).toBe(false);
    expect(result.plan).toEqual([]);
  });
});
