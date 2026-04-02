import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryWorkflowsRepository } from '@/repositories/sales/in-memory/in-memory-workflows-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ActivateWorkflowUseCase } from './activate-workflow';
import { CreateWorkflowUseCase } from './create-workflow';

let workflowsRepository: InMemoryWorkflowsRepository;
let createWorkflow: CreateWorkflowUseCase;
let activateWorkflow: ActivateWorkflowUseCase;

describe('ActivateWorkflowUseCase', () => {
  beforeEach(() => {
    workflowsRepository = new InMemoryWorkflowsRepository();
    createWorkflow = new CreateWorkflowUseCase(workflowsRepository);
    activateWorkflow = new ActivateWorkflowUseCase(workflowsRepository);
  });

  it('should activate an inactive workflow with steps', async () => {
    const { workflow } = await createWorkflow.execute({
      tenantId: 'tenant-1',
      name: 'Activate Me',
      trigger: 'ORDER_CREATED',
      steps: [{ order: 1, type: 'SEND_EMAIL', config: {} }],
    });

    const result = await activateWorkflow.execute({
      tenantId: 'tenant-1',
      id: workflow.id,
    });

    expect(result.workflow.isActive).toBe(true);
  });

  it('should throw when already active', async () => {
    const { workflow } = await createWorkflow.execute({
      tenantId: 'tenant-1',
      name: 'Already Active',
      trigger: 'ORDER_CREATED',
      isActive: true,
      steps: [{ order: 1, type: 'SEND_EMAIL', config: {} }],
    });

    await expect(() =>
      activateWorkflow.execute({
        tenantId: 'tenant-1',
        id: workflow.id,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw when workflow has no steps', async () => {
    const { workflow } = await createWorkflow.execute({
      tenantId: 'tenant-1',
      name: 'No Steps',
      trigger: 'ORDER_CREATED',
    });

    await expect(() =>
      activateWorkflow.execute({
        tenantId: 'tenant-1',
        id: workflow.id,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw when workflow not found', async () => {
    await expect(() =>
      activateWorkflow.execute({
        tenantId: 'tenant-1',
        id: 'non-existent',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
