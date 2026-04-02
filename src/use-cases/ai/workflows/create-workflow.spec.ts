import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { AiWorkflowsRepository } from '@/repositories/ai/ai-workflows-repository';
import type { AiRouter } from '@/services/ai-provider/ai-router';
import type { ToolRegistry } from '@/services/ai-tools/tool-registry';
import { CreateWorkflowUseCase } from './create-workflow';

describe('CreateWorkflowUseCase', () => {
  let sut: CreateWorkflowUseCase;
  let workflowsRepository: AiWorkflowsRepository;
  let aiRouter: AiRouter;
  let toolRegistry: ToolRegistry;

  const mockCreatedWorkflow = {
    id: { toString: () => 'wf-1' },
    name: 'Daily Report',
    description: 'Generate daily report',
    naturalPrompt: 'Generate a daily stock report',
    triggerType: 'CRON',
    triggerConfig: { cronExpression: '0 8 * * *' },
    conditions: null,
    actions: [{ toolName: 'stock_list_products', arguments: {}, order: 1 }],
    isActive: true,
    createdAt: new Date(),
  } as never;

  beforeEach(() => {
    workflowsRepository = {
      create: vi.fn().mockResolvedValue(mockCreatedWorkflow),
      findById: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findByTrigger: vi.fn(),
      findAllActiveByTrigger: vi.fn(),
    };

    aiRouter = {
      complete: vi.fn(),
      completeWithTools: vi.fn(),
      getAvailableTiers: vi.fn(),
    } as never;

    toolRegistry = {
      getAllTools: vi.fn().mockReturnValue([
        {
          name: 'stock_list_products',
          description: 'List products',
          module: 'stock',
        },
      ]),
      getToolsForUser: vi.fn(),
      getTool: vi.fn().mockReturnValue({ name: 'stock_list_products' }),
    } as never;

    sut = new CreateWorkflowUseCase(
      workflowsRepository,
      aiRouter,
      toolRegistry,
    );
  });

  it('should throw if AI returns invalid JSON', async () => {
    vi.mocked(aiRouter.complete).mockResolvedValue({
      content: 'not json',
      model: 'test',
      tokensInput: 10,
      tokensOutput: 10,
      latencyMs: 50,
      estimatedCost: 0.001,
      tier: 3,
    } as never);

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        naturalPrompt: 'Generate a daily stock report',
      }),
    ).rejects.toThrow('Não foi possível interpretar');
  });

  it('should throw if parsed result has no actions', async () => {
    vi.mocked(aiRouter.complete).mockResolvedValue({
      content: JSON.stringify({ name: 'Test', actions: [] }),
      model: 'test',
      tokensInput: 10,
      tokensOutput: 10,
      latencyMs: 50,
      estimatedCost: 0.001,
      tier: 3,
    } as never);

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        naturalPrompt: 'do something',
      }),
    ).rejects.toThrow('pelo menos um nome e uma ação');
  });

  it('should throw if no referenced tools exist', async () => {
    vi.mocked(aiRouter.complete).mockResolvedValue({
      content: JSON.stringify({
        name: 'Test',
        description: 'Test',
        triggerType: 'MANUAL',
        actions: [{ toolName: 'nonexistent_tool', arguments: {}, order: 1 }],
      }),
      model: 'test',
      tokensInput: 10,
      tokensOutput: 10,
      latencyMs: 50,
      estimatedCost: 0.001,
      tier: 3,
    } as never);

    vi.mocked(toolRegistry.getTool).mockReturnValue(undefined as never);

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        naturalPrompt: 'do something',
      }),
    ).rejects.toThrow('Nenhuma das ações do workflow');
  });

  it('should create workflow successfully', async () => {
    vi.mocked(aiRouter.complete).mockResolvedValue({
      content: JSON.stringify({
        name: 'Daily Report',
        description: 'Generate daily report',
        triggerType: 'CRON',
        triggerConfig: { cronExpression: '0 8 * * *' },
        conditions: null,
        actions: [{ toolName: 'stock_list_products', arguments: {}, order: 1 }],
      }),
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
      naturalPrompt: 'Generate a daily stock report',
    });

    expect(result.id).toBe('wf-1');
    expect(result.name).toBe('Daily Report');
    expect(workflowsRepository.create).toHaveBeenCalled();
  });
});
