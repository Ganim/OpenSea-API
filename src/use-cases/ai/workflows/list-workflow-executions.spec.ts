import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { AiWorkflowsRepository } from '@/repositories/ai/ai-workflows-repository';
import type { AiWorkflowExecutionsRepository } from '@/repositories/ai/ai-workflow-executions-repository';
import { ListWorkflowExecutionsUseCase } from './list-workflow-executions';

describe('ListWorkflowExecutionsUseCase', () => {
  let sut: ListWorkflowExecutionsUseCase;
  let workflowsRepository: AiWorkflowsRepository;
  let executionsRepository: AiWorkflowExecutionsRepository;

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

    sut = new ListWorkflowExecutionsUseCase(
      workflowsRepository,
      executionsRepository,
    );
  });

  it('should throw if workflow not found', async () => {
    vi.mocked(workflowsRepository.findById).mockResolvedValue(null);

    await expect(
      sut.execute({ workflowId: 'wf-1', tenantId: 'tenant-1' }),
    ).rejects.toThrow('Workflow não encontrado.');
  });

  it('should list executions with pagination', async () => {
    vi.mocked(workflowsRepository.findById).mockResolvedValue({
      id: { toString: () => 'wf-1' },
    } as never);

    vi.mocked(executionsRepository.findMany).mockResolvedValue({
      executions: [
        {
          id: 'exec-1',
          workflowId: 'wf-1',
          status: 'COMPLETED',
          trigger: 'MANUAL',
          results: { success: true },
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

    expect(result.data).toHaveLength(1);
    expect(result.meta.total).toBe(1);
  });
});
