export interface CreateExecutionSchema {
  workflowId: string;
  trigger: string;
}

export interface UpdateExecutionSchema {
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  results?: unknown;
  error?: string | null;
  completedAt?: Date;
}

export interface WorkflowExecutionRecord {
  id: string;
  workflowId: string;
  status: string;
  trigger: string;
  results: unknown;
  error: string | null;
  startedAt: Date;
  completedAt: Date | null;
}

export interface FindManyExecutionsOptions {
  workflowId: string;
  page?: number;
  limit?: number;
}

export interface FindManyExecutionsResult {
  executions: WorkflowExecutionRecord[];
  total: number;
}

export interface AiWorkflowExecutionsRepository {
  create(data: CreateExecutionSchema): Promise<WorkflowExecutionRecord>;
  update(
    id: string,
    data: UpdateExecutionSchema,
  ): Promise<WorkflowExecutionRecord>;
  findMany(
    options: FindManyExecutionsOptions,
  ): Promise<FindManyExecutionsResult>;
}
