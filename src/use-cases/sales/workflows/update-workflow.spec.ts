import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryWorkflowsRepository } from '@/repositories/sales/in-memory/in-memory-workflows-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateWorkflowUseCase } from './create-workflow';
import { UpdateWorkflowUseCase } from './update-workflow';

let workflowsRepository: InMemoryWorkflowsRepository;
let createWorkflow: CreateWorkflowUseCase;
let updateWorkflow: UpdateWorkflowUseCase;

describe('UpdateWorkflowUseCase', () => {
  beforeEach(() => {
    workflowsRepository = new InMemoryWorkflowsRepository();
    createWorkflow = new CreateWorkflowUseCase(workflowsRepository);
    updateWorkflow = new UpdateWorkflowUseCase(workflowsRepository);
  });

  it('should update workflow name', async () => {
    const { workflow } = await createWorkflow.execute({
      tenantId: 'tenant-1',
      name: 'Original',
      trigger: 'ORDER_CREATED',
    });

    const result = await updateWorkflow.execute({
      tenantId: 'tenant-1',
      id: workflow.id,
      name: 'Updated',
    });

    expect(result.workflow.name).toBe('Updated');
  });

  it('should update workflow steps', async () => {
    const { workflow } = await createWorkflow.execute({
      tenantId: 'tenant-1',
      name: 'Test',
      trigger: 'ORDER_CREATED',
    });

    const result = await updateWorkflow.execute({
      tenantId: 'tenant-1',
      id: workflow.id,
      steps: [
        { order: 1, type: 'SEND_EMAIL', config: { to: 'user@test.com' } },
      ],
    });

    expect(result.workflow.steps).toHaveLength(1);
    expect(result.workflow.steps[0].type).toBe('SEND_EMAIL');
  });

  it('should throw when workflow not found', async () => {
    await expect(() =>
      updateWorkflow.execute({
        tenantId: 'tenant-1',
        id: 'non-existent',
        name: 'Updated',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should not allow empty name', async () => {
    const { workflow } = await createWorkflow.execute({
      tenantId: 'tenant-1',
      name: 'Test',
      trigger: 'ORDER_CREATED',
    });

    await expect(() =>
      updateWorkflow.execute({
        tenantId: 'tenant-1',
        id: workflow.id,
        name: '  ',
      }),
    ).rejects.toThrow(BadRequestError);
  });
});
