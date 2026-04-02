import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { AiWorkflowsRepository } from '@/repositories/ai/ai-workflows-repository';
import { UpdateWorkflowUseCase } from './update-workflow';

describe('UpdateWorkflowUseCase', () => {
  let sut: UpdateWorkflowUseCase;
  let workflowsRepository: AiWorkflowsRepository;

  const mockWorkflow = {
    id: { toString: () => 'wf-1' },
    name: 'Updated Workflow',
    description: 'Updated description',
    triggerType: 'MANUAL',
    triggerConfig: null,
    conditions: null,
    actions: [],
    isActive: true,
    lastRunAt: null,
    runCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as never;

  beforeEach(() => {
    workflowsRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn().mockResolvedValue(mockWorkflow),
      delete: vi.fn(),
      findByTrigger: vi.fn(),
      findAllActiveByTrigger: vi.fn(),
    };

    sut = new UpdateWorkflowUseCase(workflowsRepository);
  });

  it('should throw if workflow not found', async () => {
    vi.mocked(workflowsRepository.findById).mockResolvedValue(null);

    await expect(
      sut.execute({ workflowId: 'wf-1', tenantId: 'tenant-1', name: 'New' }),
    ).rejects.toThrow('Workflow não encontrado.');
  });

  it('should update workflow fields', async () => {
    vi.mocked(workflowsRepository.findById).mockResolvedValue(mockWorkflow);

    const result = await sut.execute({
      workflowId: 'wf-1',
      tenantId: 'tenant-1',
      name: 'Updated Workflow',
      isActive: false,
    });

    expect(workflowsRepository.update).toHaveBeenCalledWith(
      'wf-1',
      'tenant-1',
      expect.objectContaining({ name: 'Updated Workflow', isActive: false }),
    );
    expect(result.id).toBe('wf-1');
  });
});
