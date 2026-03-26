import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryWorkflowsRepository } from '@/repositories/sales/in-memory/in-memory-workflows-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateWorkflowUseCase } from './create-workflow';
import { GetWorkflowByIdUseCase } from './get-workflow-by-id';

let workflowsRepository: InMemoryWorkflowsRepository;
let createWorkflow: CreateWorkflowUseCase;
let getWorkflowById: GetWorkflowByIdUseCase;

describe('GetWorkflowByIdUseCase', () => {
  beforeEach(() => {
    workflowsRepository = new InMemoryWorkflowsRepository();
    createWorkflow = new CreateWorkflowUseCase(workflowsRepository);
    getWorkflowById = new GetWorkflowByIdUseCase(workflowsRepository);
  });

  it('should return a workflow by id', async () => {
    const { workflow: created } = await createWorkflow.execute({
      tenantId: 'tenant-1',
      name: 'Find Me',
      trigger: 'DEAL_WON',
    });

    const result = await getWorkflowById.execute({
      tenantId: 'tenant-1',
      id: created.id,
    });

    expect(result.workflow.name).toBe('Find Me');
    expect(result.workflow.trigger).toBe('DEAL_WON');
  });

  it('should throw when workflow not found', async () => {
    await expect(() =>
      getWorkflowById.execute({
        tenantId: 'tenant-1',
        id: 'non-existent',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
