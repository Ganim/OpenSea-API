import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryWorkflowsRepository } from '@/repositories/sales/in-memory/in-memory-workflows-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateWorkflowUseCase } from './create-workflow';
import { DeactivateWorkflowUseCase } from './deactivate-workflow';

let workflowsRepository: InMemoryWorkflowsRepository;
let createWorkflow: CreateWorkflowUseCase;
let deactivateWorkflow: DeactivateWorkflowUseCase;

describe('DeactivateWorkflowUseCase', () => {
  beforeEach(() => {
    workflowsRepository = new InMemoryWorkflowsRepository();
    createWorkflow = new CreateWorkflowUseCase(workflowsRepository);
    deactivateWorkflow = new DeactivateWorkflowUseCase(workflowsRepository);
  });

  it('should deactivate an active workflow', async () => {
    const { workflow } = await createWorkflow.execute({
      tenantId: 'tenant-1',
      name: 'Deactivate Me',
      trigger: 'ORDER_CREATED',
      isActive: true,
      steps: [{ order: 1, type: 'SEND_EMAIL', config: {} }],
    });

    const result = await deactivateWorkflow.execute({
      tenantId: 'tenant-1',
      id: workflow.id,
    });

    expect(result.workflow.isActive).toBe(false);
  });

  it('should throw when already inactive', async () => {
    const { workflow } = await createWorkflow.execute({
      tenantId: 'tenant-1',
      name: 'Already Inactive',
      trigger: 'ORDER_CREATED',
    });

    await expect(() =>
      deactivateWorkflow.execute({
        tenantId: 'tenant-1',
        id: workflow.id,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw when workflow not found', async () => {
    await expect(() =>
      deactivateWorkflow.execute({
        tenantId: 'tenant-1',
        id: 'non-existent',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
