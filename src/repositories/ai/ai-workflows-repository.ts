import type { AiWorkflow } from '@/entities/ai/ai-workflow';

export interface CreateWorkflowSchema {
  tenantId: string;
  userId: string;
  name: string;
  description: string;
  naturalPrompt: string;
  triggerType: 'MANUAL' | 'CRON' | 'EVENT';
  triggerConfig?: Record<string, unknown> | null;
  conditions?: unknown[] | null;
  actions: unknown[];
}

export interface UpdateWorkflowSchema {
  name?: string;
  description?: string;
  triggerType?: 'MANUAL' | 'CRON' | 'EVENT';
  triggerConfig?: Record<string, unknown> | null;
  conditions?: unknown[] | null;
  actions?: unknown[];
  isActive?: boolean;
  lastRunAt?: Date;
  runCount?: number;
  lastError?: string | null;
}

export interface FindManyWorkflowsOptions {
  tenantId: string;
  isActive?: boolean;
  triggerType?: 'MANUAL' | 'CRON' | 'EVENT';
  search?: string;
  page?: number;
  limit?: number;
}

export interface FindManyWorkflowsResult {
  workflows: AiWorkflow[];
  total: number;
}

export interface AiWorkflowsRepository {
  create(data: CreateWorkflowSchema): Promise<AiWorkflow>;
  findById(id: string, tenantId: string): Promise<AiWorkflow | null>;
  findMany(options: FindManyWorkflowsOptions): Promise<FindManyWorkflowsResult>;
  update(
    id: string,
    tenantId: string,
    data: UpdateWorkflowSchema,
  ): Promise<AiWorkflow>;
  delete(id: string, tenantId: string): Promise<void>;
  findByTrigger(
    tenantId: string,
    triggerType: 'MANUAL' | 'CRON' | 'EVENT',
  ): Promise<AiWorkflow[]>;
  findAllActiveByTrigger(
    triggerType: 'MANUAL' | 'CRON' | 'EVENT',
  ): Promise<AiWorkflow[]>;
}
