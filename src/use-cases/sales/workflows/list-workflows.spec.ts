import { InMemoryWorkflowsRepository } from '@/repositories/sales/in-memory/in-memory-workflows-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateWorkflowUseCase } from './create-workflow';
import { ListWorkflowsUseCase } from './list-workflows';

let workflowsRepository: InMemoryWorkflowsRepository;
let createWorkflow: CreateWorkflowUseCase;
let listWorkflows: ListWorkflowsUseCase;

describe('ListWorkflowsUseCase', () => {
  beforeEach(() => {
    workflowsRepository = new InMemoryWorkflowsRepository();
    createWorkflow = new CreateWorkflowUseCase(workflowsRepository);
    listWorkflows = new ListWorkflowsUseCase(workflowsRepository);
  });

  it('should list workflows with pagination', async () => {
    for (let i = 1; i <= 5; i++) {
      await createWorkflow.execute({
        tenantId: 'tenant-1',
        name: `Workflow ${i}`,
        trigger: 'ORDER_CREATED',
      });
    }

    const result = await listWorkflows.execute({
      tenantId: 'tenant-1',
      page: 1,
      perPage: 3,
    });

    expect(result.workflows).toHaveLength(3);
    expect(result.total).toBe(5);
    expect(result.totalPages).toBe(2);
  });

  it('should return empty list when no workflows exist', async () => {
    const result = await listWorkflows.execute({
      tenantId: 'tenant-1',
    });

    expect(result.workflows).toHaveLength(0);
    expect(result.total).toBe(0);
  });
});
