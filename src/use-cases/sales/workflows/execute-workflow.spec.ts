import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryWorkflowsRepository } from '@/repositories/sales/in-memory/in-memory-workflows-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateWorkflowUseCase } from './create-workflow';
import { ExecuteWorkflowUseCase } from './execute-workflow';

let workflowsRepository: InMemoryWorkflowsRepository;
let createWorkflow: CreateWorkflowUseCase;
let executeWorkflow: ExecuteWorkflowUseCase;

describe('ExecuteWorkflowUseCase', () => {
  beforeEach(() => {
    workflowsRepository = new InMemoryWorkflowsRepository();
    createWorkflow = new CreateWorkflowUseCase(workflowsRepository);
    executeWorkflow = new ExecuteWorkflowUseCase(workflowsRepository);
  });

  it('should execute active workflows for a given trigger', async () => {
    await createWorkflow.execute({
      tenantId: 'tenant-1',
      name: 'Welcome Flow',
      trigger: 'CUSTOMER_CREATED',
      isActive: true,
      steps: [
        { order: 1, type: 'SEND_EMAIL', config: { template: 'welcome' } },
        { order: 2, type: 'CREATE_TASK', config: { title: 'Follow up' } },
      ],
    });

    const result = await executeWorkflow.execute({
      tenantId: 'tenant-1',
      trigger: 'CUSTOMER_CREATED',
    });

    expect(result.totalWorkflowsExecuted).toBe(1);
    expect(result.executionLogs[0].stepsExecuted).toHaveLength(2);
    expect(result.executionLogs[0].stepsExecuted[0].stepType).toBe('SEND_EMAIL');
    expect(result.executionLogs[0].stepsExecuted[1].stepType).toBe('CREATE_TASK');
  });

  it('should increment execution count after execution', async () => {
    await createWorkflow.execute({
      tenantId: 'tenant-1',
      name: 'Counter Flow',
      trigger: 'ORDER_CREATED',
      isActive: true,
      steps: [
        { order: 1, type: 'SEND_NOTIFICATION', config: {} },
      ],
    });

    await executeWorkflow.execute({
      tenantId: 'tenant-1',
      trigger: 'ORDER_CREATED',
    });

    expect(workflowsRepository.items[0].executionCount).toBe(1);
    expect(workflowsRepository.items[0].lastExecutedAt).toBeDefined();
  });

  it('should execute multiple workflows for the same trigger', async () => {
    await createWorkflow.execute({
      tenantId: 'tenant-1',
      name: 'Flow 1',
      trigger: 'ORDER_CONFIRMED',
      isActive: true,
      steps: [{ order: 1, type: 'SEND_EMAIL', config: {} }],
    });

    await createWorkflow.execute({
      tenantId: 'tenant-1',
      name: 'Flow 2',
      trigger: 'ORDER_CONFIRMED',
      isActive: true,
      steps: [{ order: 1, type: 'SEND_NOTIFICATION', config: {} }],
    });

    const result = await executeWorkflow.execute({
      tenantId: 'tenant-1',
      trigger: 'ORDER_CONFIRMED',
    });

    expect(result.totalWorkflowsExecuted).toBe(2);
  });

  it('should throw when no active workflows found for trigger', async () => {
    await expect(() =>
      executeWorkflow.execute({
        tenantId: 'tenant-1',
        trigger: 'DEAL_LOST',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should not execute inactive workflows', async () => {
    await createWorkflow.execute({
      tenantId: 'tenant-1',
      name: 'Inactive Flow',
      trigger: 'QUOTE_SENT',
      isActive: false,
      steps: [{ order: 1, type: 'SEND_EMAIL', config: {} }],
    });

    await expect(() =>
      executeWorkflow.execute({
        tenantId: 'tenant-1',
        trigger: 'QUOTE_SENT',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
