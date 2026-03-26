import type { Workflow } from '@/entities/sales/workflow';

export interface WorkflowStepDTO {
  id: string;
  order: number;
  type: string;
  config: Record<string, unknown>;
}

export interface WorkflowDTO {
  id: string;
  name: string;
  description?: string;
  trigger: string;
  isActive: boolean;
  executionCount: number;
  lastExecutedAt?: Date;
  steps: WorkflowStepDTO[];
  createdAt: Date;
  updatedAt?: Date;
}

export function workflowToDTO(workflow: Workflow): WorkflowDTO {
  const dto: WorkflowDTO = {
    id: workflow.id.toString(),
    name: workflow.name,
    trigger: workflow.trigger,
    isActive: workflow.isActive,
    executionCount: workflow.executionCount,
    steps: workflow.steps.map((step) => ({
      id: step.id.toString(),
      order: step.order,
      type: step.type,
      config: step.config,
    })),
    createdAt: workflow.createdAt,
  };

  if (workflow.description) dto.description = workflow.description;
  if (workflow.lastExecutedAt) dto.lastExecutedAt = workflow.lastExecutedAt;
  if (workflow.updatedAt) dto.updatedAt = workflow.updatedAt;

  return dto;
}
