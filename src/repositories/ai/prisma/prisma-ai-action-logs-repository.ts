import { prisma } from '@/lib/prisma';
import type {
  AiActionLogsRepository,
  AiActionLogDTO,
  CreateActionLogSchema,
  FindManyActionLogsOptions,
  FindManyActionLogsResult,
} from '../ai-action-logs-repository';
import type {
  AiActionStatus,
  Prisma,
  AiActionLog,
} from '@prisma/generated/client.js';

function toDTO(raw: AiActionLog): AiActionLogDTO {
  return {
    id: raw.id,
    tenantId: raw.tenantId,
    userId: raw.userId,
    conversationId: raw.conversationId,
    messageId: raw.messageId,
    actionType: raw.actionType,
    targetModule: raw.targetModule,
    targetEntityType: raw.targetEntityType,
    targetEntityId: raw.targetEntityId,
    input: raw.input as Record<string, unknown>,
    output: raw.output as Record<string, unknown> | null,
    status: raw.status,
    confirmedByUserId: raw.confirmedByUserId,
    confirmedAt: raw.confirmedAt,
    executedAt: raw.executedAt,
    error: raw.error,
    createdAt: raw.createdAt,
  };
}

export class PrismaAiActionLogsRepository implements AiActionLogsRepository {
  async create(data: CreateActionLogSchema): Promise<AiActionLogDTO> {
    const raw = await prisma.aiActionLog.create({
      data: {
        tenantId: data.tenantId,
        userId: data.userId,
        conversationId: data.conversationId ?? null,
        messageId: data.messageId ?? null,
        actionType: data.actionType,
        targetModule: data.targetModule,
        targetEntityType: data.targetEntityType,
        targetEntityId: data.targetEntityId ?? null,
        input: data.input as Prisma.InputJsonValue,
        status: (data.status as AiActionStatus) ?? 'PROPOSED',
      },
    });
    return toDTO(raw);
  }

  async findById(id: string): Promise<AiActionLogDTO | null> {
    const raw = await prisma.aiActionLog.findUnique({ where: { id } });
    return raw ? toDTO(raw) : null;
  }

  async updateStatus(
    id: string,
    status: string,
    extra?: {
      confirmedByUserId?: string;
      confirmedAt?: Date;
      executedAt?: Date;
      output?: Record<string, unknown>;
      error?: string;
    },
  ): Promise<AiActionLogDTO> {
    const raw = await prisma.aiActionLog.update({
      where: { id },
      data: {
        status: status as AiActionStatus,
        confirmedByUserId: extra?.confirmedByUserId,
        confirmedAt: extra?.confirmedAt,
        executedAt: extra?.executedAt,
        output: extra?.output
          ? (extra.output as Prisma.InputJsonValue)
          : undefined,
        error: extra?.error,
      },
    });
    return toDTO(raw);
  }

  async findMany(
    options: FindManyActionLogsOptions,
  ): Promise<FindManyActionLogsResult> {
    const page = options.page ?? 1;
    const limit = Math.min(options.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.AiActionLogWhereInput = {
      tenantId: options.tenantId,
    };

    if (options.userId) {
      where.userId = options.userId;
    }

    if (options.status) {
      where.status = options.status as AiActionStatus;
    }

    if (options.targetModule) {
      where.targetModule = options.targetModule;
    }

    const [actions, total] = await Promise.all([
      prisma.aiActionLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.aiActionLog.count({ where }),
    ]);

    return {
      actions: actions.map(toDTO),
      total,
    };
  }
}
