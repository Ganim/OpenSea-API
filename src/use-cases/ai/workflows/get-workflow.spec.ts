import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { AiWorkflowsRepository } from '@/repositories/ai/ai-workflows-repository';
import type { AiWorkflowExecutionsRepository } from '@/repositories/ai/ai-workflow-executions-repository';
import { GetWorkflowUseCase } from './get-workflow';

describe('GetWorkflowUseCase', () => {
  let sut: GetWorkflowUseCase;
  let workflowsRepository: AiWorkflowsRepository;
  let executionsRepository: AiWorkflowExecutionsRepository;

  const mockWorkflow = {
    id: { toString: () => 'wf-1' },
    tenantId: { toString: () => 'tenant-1' },
    userId: { toString: () => 'user-1' },
    name: 'Test Workflow',
    description: 'A test workflow',
    naturalPrompt: 'Do something daily',
    triggerType: 'MANUAL',
    triggerConfig: null,
    conditions: null,
    actions: [{ toolName: 'stock_list_products', arguments: {}, order: 1 }],
    isActive: true,
    lastRunAt: null,
    runCount: 0,
    lastError: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as never;

  beforeEach(() => {
    workflowsRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findByTrigger: vi.fn(),
      findAllActiveByTrigger: vi.fn(),
    };

    executionsRepository = {
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn().mockResolvedValue({ executions: [], total: 0 }),
    };

    sut = new GetWorkflowUseCase(workflowsRepository, executionsRepository);
  });

  it('should throw if workflow not found', async () => {
    vi.mocked(workflowsRepository.findById).mockResolvedValue(null);

    await expect(
      sut.execute({ workflowId: 'wf-1', tenantId: 'tenant-1' }),
    ).rejects.toThrow('Workflow não encontrado.');
  });

  it('should return workflow with recent executions', async () => {
    vi.mocked(workflowsRepository.findById).mockResolvedValue(mockWorkflow);
    vi.mocked(executionsRepository.findMany).mockResolvedValue({
      executions: [
        {
          id: 'exec-1',
          status: 'COMPLETED',
          trigger: 'MANUAL',
          error: null,
          startedAt: new Date(),
          completedAt: new Date(),
        },
      ] as never,
      total: 1,
    });

    const result = await sut.execute({
      workflowId: 'wf-1',
      tenantId: 'tenant-1',
    });

    expect(result.id).toBe('wf-1');
    expect(result.name).toBe('Test Workflow');
    expect(result.recentExecutions).toHaveLength(1);
    expect(result.recentExecutions[0].status).toBe('COMPLETED');
  });
});
