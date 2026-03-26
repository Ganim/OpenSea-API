import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Workflow, type WorkflowTriggerType, type WorkflowStepTypeValue } from '@/entities/sales/workflow';

export interface CreateWorkflowStepSchema {
  order: number;
  type: WorkflowStepTypeValue;
  config: Record<string, unknown>;
}

export interface CreateWorkflowSchema {
  tenantId: string;
  name: string;
  description?: string;
  trigger: WorkflowTriggerType;
  isActive?: boolean;
  steps?: CreateWorkflowStepSchema[];
}

export interface WorkflowsRepository {
  create(data: CreateWorkflowSchema): Promise<Workflow>;
  findById(id: UniqueEntityID, tenantId: string): Promise<Workflow | null>;
  findByTrigger(trigger: WorkflowTriggerType, tenantId: string): Promise<Workflow[]>;
  findMany(page: number, perPage: number, tenantId: string): Promise<Workflow[]>;
  countByTenant(tenantId: string): Promise<number>;
  save(workflow: Workflow): Promise<void>;
  delete(id: UniqueEntityID, tenantId: string): Promise<void>;
}
