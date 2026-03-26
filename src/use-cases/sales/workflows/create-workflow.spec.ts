import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { InMemoryWorkflowsRepository } from '@/repositories/sales/in-memory/in-memory-workflows-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateWorkflowUseCase } from './create-workflow';

let workflowsRepository: InMemoryWorkflowsRepository;
let createWorkflow: CreateWorkflowUseCase;

describe('CreateWorkflowUseCase', () => {
  beforeEach(() => {
    workflowsRepository = new InMemoryWorkflowsRepository();
    createWorkflow = new CreateWorkflowUseCase(workflowsRepository);
  });

  it('should create a workflow without steps', async () => {
    const result = await createWorkflow.execute({
      tenantId: 'tenant-1',
      name: 'Welcome Workflow',
      trigger: 'CUSTOMER_CREATED',
    });

    expect(result.workflow).toBeDefined();
    expect(result.workflow.name).toBe('Welcome Workflow');
    expect(result.workflow.trigger).toBe('CUSTOMER_CREATED');
    expect(result.workflow.isActive).toBe(false);
    expect(result.workflow.steps).toHaveLength(0);
  });

  it('should create a workflow with steps', async () => {
    const result = await createWorkflow.execute({
      tenantId: 'tenant-1',
      name: 'Order Confirmation',
      trigger: 'ORDER_CONFIRMED',
      steps: [
        { order: 1, type: 'SEND_EMAIL', config: { template: 'order-confirmed' } },
        { order: 2, type: 'SEND_NOTIFICATION', config: { message: 'Order confirmed!' } },
      ],
    });

    expect(result.workflow.steps).toHaveLength(2);
    expect(result.workflow.steps[0].type).toBe('SEND_EMAIL');
    expect(result.workflow.steps[1].type).toBe('SEND_NOTIFICATION');
  });

  it('should not allow empty name', async () => {
    await expect(() =>
      createWorkflow.execute({
        tenantId: 'tenant-1',
        name: '',
        trigger: 'ORDER_CREATED',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not allow invalid trigger type', async () => {
    await expect(() =>
      createWorkflow.execute({
        tenantId: 'tenant-1',
        name: 'Bad Trigger',
        trigger: 'INVALID_TRIGGER' as never,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not allow invalid step type', async () => {
    await expect(() =>
      createWorkflow.execute({
        tenantId: 'tenant-1',
        name: 'Bad Steps',
        trigger: 'ORDER_CREATED',
        steps: [
          { order: 1, type: 'INVALID_TYPE' as never, config: {} },
        ],
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not allow duplicate step order values', async () => {
    await expect(() =>
      createWorkflow.execute({
        tenantId: 'tenant-1',
        name: 'Duplicate Steps',
        trigger: 'ORDER_CREATED',
        steps: [
          { order: 1, type: 'SEND_EMAIL', config: {} },
          { order: 1, type: 'SEND_NOTIFICATION', config: {} },
        ],
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should trim name', async () => {
    const result = await createWorkflow.execute({
      tenantId: 'tenant-1',
      name: '  Trimmed  ',
      trigger: 'ORDER_CREATED',
    });

    expect(result.workflow.name).toBe('Trimmed');
  });
});
