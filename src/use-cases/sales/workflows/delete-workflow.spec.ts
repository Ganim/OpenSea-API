import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryWorkflowsRepository } from '@/repositories/sales/in-memory/in-memory-workflows-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateWorkflowUseCase } from './create-workflow';
import { DeleteWorkflowUseCase } from './delete-workflow';

let workflowsRepository: InMemoryWorkflowsRepository;
let createWorkflow: CreateWorkflowUseCase;
let deleteWorkflow: DeleteWorkflowUseCase;

describe('DeleteWorkflowUseCase', () => {
  beforeEach(() => {
    workflowsRepository = new InMemoryWorkflowsRepository();
    createWorkflow = new CreateWorkflowUseCase(workflowsRepository);
    deleteWorkflow = new DeleteWorkflowUseCase(workflowsRepository);
  });

  it('should soft delete a workflow', async () => {
    const { workflow } = await createWorkflow.execute({
      tenantId: 'tenant-1',
      name: 'To Delete',
      trigger: 'ORDER_CREATED',
    });

    const result = await deleteWorkflow.execute({
      tenantId: 'tenant-1',
      id: workflow.id,
    });

    expect(result.message).toBe('Workflow deleted successfully.');
    expect(workflowsRepository.items[0].deletedAt).toBeDefined();
  });

  it('should throw when workflow not found', async () => {
    await expect(() =>
      deleteWorkflow.execute({
        tenantId: 'tenant-1',
        id: 'non-existent',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
