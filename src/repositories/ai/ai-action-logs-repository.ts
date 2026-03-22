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

export interface AiActionLogsRepository {
  findMany(
    options: FindManyActionLogsOptions,
  ): Promise<FindManyActionLogsResult>;
}
