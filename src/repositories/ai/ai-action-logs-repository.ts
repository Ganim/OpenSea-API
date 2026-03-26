export interface AiActionLogDTO {
  id: string;
  tenantId: string;
  userId: string;
  conversationId: string | null;
  messageId: string | null;
  actionType: string;
  targetModule: string;
  targetEntityType: string;
  targetEntityId: string | null;
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  status: string;
  confirmedByUserId: string | null;
  confirmedAt: Date | null;
  executedAt: Date | null;
  error: string | null;
  auditLogId: string | null;
  createdAt: Date;
}

export interface FindManyActionLogsOptions {
  tenantId: string;
  userId?: string;
  status?: string;
  targetModule?: string;
  page?: number;
  limit?: number;
}

export interface FindManyActionLogsResult {
  actions: AiActionLogDTO[];
  total: number;
}

export interface CreateActionLogSchema {
  tenantId: string;
  userId: string;
  conversationId?: string | null;
  messageId?: string | null;
  actionType: string;
  targetModule: string;
  targetEntityType: string;
  targetEntityId?: string | null;
  input: Record<string, unknown>;
  status?: string;
}

export interface AiActionLogsRepository {
  create(data: CreateActionLogSchema): Promise<AiActionLogDTO>;
  findById(id: string): Promise<AiActionLogDTO | null>;
  updateStatus(
    id: string,
    status: string,
    extra?: {
      confirmedByUserId?: string;
      confirmedAt?: Date;
      executedAt?: Date;
      output?: Record<string, unknown>;
      error?: string;
      auditLogId?: string;
    },
  ): Promise<AiActionLogDTO>;
  findLastExecutedByConversation(
    conversationId: string,
    tenantId: string,
  ): Promise<AiActionLogDTO | null>;
  findMany(
    options: FindManyActionLogsOptions,
  ): Promise<FindManyActionLogsResult>;
}
