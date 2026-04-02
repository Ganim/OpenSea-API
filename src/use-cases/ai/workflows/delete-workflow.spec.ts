import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { AiWorkflowsRepository } from '@/repositories/ai/ai-workflows-repository';
import { DeleteWorkflowUseCase } from './delete-workflow';

describe('DeleteWorkflowUseCase', () => {
  let sut: DeleteWorkflowUseCase;
  let workflowsRepository: AiWorkflowsRepository;

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

    sut = new DeleteWorkflowUseCase(workflowsRepository);
  });

  it('should throw if workflow not found', async () => {
    vi.mocked(workflowsRepository.findById).mockResolvedValue(null);

    await expect(
      sut.execute({ workflowId: 'wf-1', tenantId: 'tenant-1' }),
    ).rejects.toThrow('Workflow não encontrado.');
  });

  it('should delete workflow successfully', async () => {
    vi.mocked(workflowsRepository.findById).mockResolvedValue({
      id: { toString: () => 'wf-1' },
    } as never);

    await sut.execute({ workflowId: 'wf-1', tenantId: 'tenant-1' });

    expect(workflowsRepository.delete).toHaveBeenCalledWith('wf-1', 'tenant-1');
  });
});
