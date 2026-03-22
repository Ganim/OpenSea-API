// EventLog model not yet in Prisma schema — defining status type locally
type EventLogStatus =
  | 'PUBLISHED'
  | 'PROCESSING'
  | 'PROCESSED'
  | 'FAILED'
  | 'DEAD_LETTER';

export interface EventLogCreateInput {
  id: string;
  tenantId: string;
  type: string;
  version: number;
  source: string;
  sourceEntityType: string;
  sourceEntityId: string;
  data: Record<string, unknown>;
  metadata?: Record<string, unknown> | null;
  correlationId?: string | null;
  causationId?: string | null;
  status?: EventLogStatus;
  maxRetries?: number;
}

export interface EventLogRecord {
  id: string;
  tenantId: string;
  type: string;
  version: number;
  source: string;
  sourceEntityType: string;
  sourceEntityId: string;
  data: unknown;
  metadata: unknown;
  correlationId: string | null;
  causationId: string | null;
  status: EventLogStatus;
  processedBy: string[];
  failedConsumers: unknown;
  retryCount: number;
  maxRetries: number;
  nextRetryAt: Date | null;
  processedAt: Date | null;
  createdAt: Date;
}

export interface EventLogFilters {
  tenantId?: string;
  type?: string;
  status?: EventLogStatus;
  correlationId?: string;
  sourceEntityType?: string;
  sourceEntityId?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  page?: number;
  limit?: number;
}

export interface EventLogRepository {
  create(input: EventLogCreateInput): Promise<EventLogRecord>;
  findById(id: string): Promise<EventLogRecord | null>;
  findMany(filters: EventLogFilters): Promise<{
    data: EventLogRecord[];
    total: number;
  }>;
  updateStatus(
    id: string,
    status: EventLogStatus,
    extra?: {
      processedBy?: string[];
      failedConsumers?: Record<string, string>;
      retryCount?: number;
      nextRetryAt?: Date | null;
      processedAt?: Date | null;
    },
  ): Promise<EventLogRecord>;
  findDeadLetters(tenantId: string, limit?: number): Promise<EventLogRecord[]>;
  replay(id: string): Promise<EventLogRecord>;
}
