import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { AiWorkflowsRepository } from '@/repositories/ai/ai-workflows-repository';
import { ListWorkflowsUseCase } from './list-workflows';

describe('ListWorkflowsUseCase', () => {
  let sut: ListWorkflowsUseCase;
  let workflowsRepository: AiWorkflowsRepository;

  beforeEach(() => {
    workflowsRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findMany: vi.fn().mockResolvedValue({ workflows: [], total: 0 }),
      update: vi.fn(),
      delete: vi.fn(),
      findByTrigger: vi.fn(),
      findAllActiveByTrigger: vi.fn(),
    };

    sut = new ListWorkflowsUseCase(workflowsRepository);
  });

  it('should list workflows with default pagination', async () => {
    const mockWorkflow = {
      id: { toString: () => 'wf-1' },
      name: 'Weekly Report',
      description: 'Generate weekly report',
      triggerType: 'CRON',
      actions: [],
      isActive: true,
      lastRunAt: null,
      runCount: 0,
      lastError: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(workflowsRepository.findMany).mockResolvedValue({
      workflows: [mockWorkflow] as never,
      total: 1,
    });

    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].id).toBe('wf-1');
    expect(result.meta).toEqual({
      total: 1,
      page: 1,
      limit: 20,
      pages: 1,
    });
  });

  it('should pass filters to repository', async () => {
    await sut.execute({
      tenantId: 'tenant-1',
      isActive: true,
      triggerType: 'CRON',
      search: 'report',
    });

    expect(workflowsRepository.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        isActive: true,
        triggerType: 'CRON',
        search: 'report',
      }),
    );
  });
});
