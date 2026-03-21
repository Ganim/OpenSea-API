import type { PrismaClient } from '@prisma/generated';

import type {
  EventLogCreateInput,
  EventLogFilters,
  EventLogRecord,
  EventLogRepository,
} from '../event-log-repository';

export class PrismaEventLogRepository implements EventLogRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: EventLogCreateInput): Promise<EventLogRecord> {
    return this.prisma.eventLog.create({
      data: {
        id: input.id,
        tenantId: input.tenantId,
        type: input.type,
        version: input.version,
        source: input.source,
        sourceEntityType: input.sourceEntityType,
        sourceEntityId: input.sourceEntityId,
        data: input.data,
        metadata: input.metadata ?? undefined,
        correlationId: input.correlationId ?? undefined,
        causationId: input.causationId ?? undefined,
        status: input.status ?? 'PUBLISHED',
        maxRetries: input.maxRetries ?? 3,
      },
    }) as unknown as EventLogRecord;
  }

  async findById(id: string): Promise<EventLogRecord | null> {
    return this.prisma.eventLog.findUnique({
      where: { id },
    }) as unknown as EventLogRecord | null;
  }

  async findMany(
    filters: EventLogFilters,
  ): Promise<{ data: EventLogRecord[]; total: number }> {
    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 20, 100);

    const where: Record<string, unknown> = {};

    if (filters.tenantId) where.tenantId = filters.tenantId;
    if (filters.type) where.type = filters.type;
    if (filters.status) where.status = filters.status;
    if (filters.correlationId) where.correlationId = filters.correlationId;
    if (filters.sourceEntityType)
      where.sourceEntityType = filters.sourceEntityType;
    if (filters.sourceEntityId)
      where.sourceEntityId = filters.sourceEntityId;

    if (filters.createdAfter || filters.createdBefore) {
      const createdAt: Record<string, Date> = {};
      if (filters.createdAfter) createdAt.gte = filters.createdAfter;
      if (filters.createdBefore) createdAt.lte = filters.createdBefore;
      where.createdAt = createdAt;
    }

    const [data, total] = await Promise.all([
      this.prisma.eventLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.eventLog.count({ where }),
    ]);

    return {
      data: data as unknown as EventLogRecord[],
      total,
    };
  }

  async updateStatus(
    id: string,
    status: string,
    extra?: {
      processedBy?: string[];
      failedConsumers?: Record<string, string>;
      retryCount?: number;
      nextRetryAt?: Date | null;
      processedAt?: Date | null;
    },
  ): Promise<EventLogRecord> {
    const data: Record<string, unknown> = { status };

    if (extra?.processedBy !== undefined) data.processedBy = extra.processedBy;
    if (extra?.failedConsumers !== undefined)
      data.failedConsumers = extra.failedConsumers;
    if (extra?.retryCount !== undefined) data.retryCount = extra.retryCount;
    if (extra?.nextRetryAt !== undefined) data.nextRetryAt = extra.nextRetryAt;
    if (extra?.processedAt !== undefined) data.processedAt = extra.processedAt;

    return this.prisma.eventLog.update({
      where: { id },
      data,
    }) as unknown as EventLogRecord;
  }

  async findDeadLetters(
    tenantId: string,
    limit = 50,
  ): Promise<EventLogRecord[]> {
    return this.prisma.eventLog.findMany({
      where: {
        tenantId,
        status: 'DEAD_LETTER',
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    }) as unknown as EventLogRecord[];
  }

  async replay(id: string): Promise<EventLogRecord> {
    return this.prisma.eventLog.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        retryCount: 0,
        nextRetryAt: null,
        processedAt: null,
        failedConsumers: undefined,
        processedBy: [],
      },
    }) as unknown as EventLogRecord;
  }
}
