import { prisma } from '@/lib/prisma';
import type {
  CardActivityType,
  Prisma,
} from '@prisma/generated/client.js';
import type {
  CardActivityRecord,
  CardActivitiesRepository,
  CreateCardActivitySchema,
  FindManyBoardActivitiesOptions,
  FindManyBoardActivitiesResult,
  FindManyCardActivitiesOptions,
  FindManyCardActivitiesResult,
} from '../card-activities-repository';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toRecord(raw: any): CardActivityRecord {
  return {
    id: raw.id,
    cardId: raw.cardId,
    boardId: raw.boardId,
    userId: raw.userId,
    type: raw.type,
    description: raw.description,
    field: raw.field,
    oldValue: raw.oldValue,
    newValue: raw.newValue,
    metadata: (raw.metadata as Record<string, unknown>) ?? null,
    createdAt: raw.createdAt,
    userName: null,
  };
}

export class PrismaCardActivitiesRepository
  implements CardActivitiesRepository
{
  async create(
    data: CreateCardActivitySchema,
  ): Promise<CardActivityRecord> {
    const raw = await prisma.cardActivity.create({
      data: {
        cardId: data.cardId,
        boardId: data.boardId,
        userId: data.userId,
        type: data.type as CardActivityType,
        description: data.description,
        field: data.field,
        oldValue: data.oldValue as Prisma.InputJsonValue,
        newValue: data.newValue as Prisma.InputJsonValue,
        metadata: (data.metadata as Prisma.InputJsonValue) ?? undefined,
      },
    });

    return toRecord(raw);
  }

  async findByCardId(
    options: FindManyCardActivitiesOptions,
  ): Promise<FindManyCardActivitiesResult> {
    const { cardId, type, page = 1, limit = 20 } = options;

    const where: Prisma.CardActivityWhereInput = {
      cardId,
      ...(type && { type: type as CardActivityType }),
    };

    const [activities, total] = await Promise.all([
      prisma.cardActivity.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.cardActivity.count({ where }),
    ]);

    return { activities: activities.map(toRecord), total };
  }

  async findByBoardId(
    options: FindManyBoardActivitiesOptions,
  ): Promise<FindManyBoardActivitiesResult> {
    const { boardId, type, page = 1, limit = 20 } = options;

    const where: Prisma.CardActivityWhereInput = {
      boardId,
      ...(type && { type: type as CardActivityType }),
    };

    const [activities, total] = await Promise.all([
      prisma.cardActivity.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.cardActivity.count({ where }),
    ]);

    return { activities: activities.map(toRecord), total };
  }
}
