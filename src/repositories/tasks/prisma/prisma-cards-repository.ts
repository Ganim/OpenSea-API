import type { Card } from '@/entities/tasks/card';
import { prisma } from '@/lib/prisma';
import { cardPrismaToDomain } from '@/mappers/tasks/card/card-prisma-to-domain';
import type {
  CardWithLabelIds,
  CardsRepository,
  CreateCardSchema,
  FindManyCardsOptions,
  FindManyCardsResult,
  UpdateCardSchema,
} from '../cards-repository';
import type {
  CardPriority,
  CardStatus,
  Prisma,
} from '@prisma/generated/client.js';

export class PrismaCardsRepository implements CardsRepository {
  async create(data: CreateCardSchema): Promise<Card> {
    const raw = await prisma.card.create({
      data: {
        boardId: data.boardId,
        columnId: data.columnId,
        parentCardId: data.parentCardId,
        title: data.title,
        description: data.description,
        status: (data.status as CardStatus) ?? 'OPEN',
        priority: (data.priority as CardPriority) ?? 'NONE',
        position: data.position ?? 0,
        assigneeId: data.assigneeId,
        reporterId: data.reporterId,
        startDate: data.startDate,
        dueDate: data.dueDate,
        estimatedMinutes: data.estimatedMinutes,
        coverColor: data.coverColor,
        coverImageId: data.coverImageId,
        metadata: (data.metadata as Prisma.InputJsonValue) ?? undefined,
        systemSourceType: data.systemSourceType,
        systemSourceId: data.systemSourceId,
        labels: data.labelIds?.length
          ? { create: data.labelIds.map((labelId) => ({ labelId })) }
          : undefined,
      },
    });

    return cardPrismaToDomain(raw);
  }

  async findById(id: string, boardId: string): Promise<Card | null> {
    const raw = await prisma.card.findFirst({
      where: { id, boardId, deletedAt: null },
    });

    return raw ? cardPrismaToDomain(raw) : null;
  }

  async findByIdWithLabels(
    id: string,
    boardId: string,
  ): Promise<CardWithLabelIds | null> {
    const raw = await prisma.card.findFirst({
      where: { id, boardId, deletedAt: null },
      include: {
        labels: { include: { label: true } },
      },
    });

    if (!raw) return null;

    return {
      card: cardPrismaToDomain(raw),
      labelIds: raw.labels.map((cl) => cl.labelId),
    };
  }

  async findMany(options: FindManyCardsOptions): Promise<FindManyCardsResult> {
    const {
      boardId,
      columnId,
      assigneeId,
      reporterId,
      labelIds,
      priority,
      status,
      search,
      startDate,
      endDate,
      includeArchived,
      parentCardId,
      page = 1,
      limit = 20,
    } = options;

    const where: Prisma.CardWhereInput = {
      boardId,
      deletedAt: null,
      ...(!includeArchived && { archivedAt: null }),
      ...(columnId && { columnId }),
      ...(assigneeId && { assigneeId }),
      ...(reporterId && { reporterId }),
      ...(priority && { priority: priority as CardPriority }),
      ...(status && { status: status as CardStatus }),
      ...(search && {
        title: { contains: search, mode: 'insensitive' },
      }),
      ...(startDate && { createdAt: { gte: startDate } }),
      ...(endDate && { createdAt: { lte: endDate } }),
      ...(parentCardId !== undefined && { parentCardId }),
      ...(labelIds?.length && {
        labels: { some: { labelId: { in: labelIds } } },
      }),
    };

    const [cards, total] = await Promise.all([
      prisma.card.findMany({
        where,
        orderBy: { position: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.card.count({ where }),
    ]);

    return { cards: cards.map(cardPrismaToDomain), total };
  }

  async findBySystemSource(
    tenantId: string,
    sourceType: string,
    sourceId: string,
  ): Promise<Card | null> {
    const raw = await prisma.card.findFirst({
      where: {
        systemSourceType: sourceType,
        systemSourceId: sourceId,
        board: { tenantId },
        deletedAt: null,
      },
    });

    return raw ? cardPrismaToDomain(raw) : null;
  }

  async findSubtasks(parentCardId: string): Promise<Card[]> {
    const rows = await prisma.card.findMany({
      where: { parentCardId, deletedAt: null },
      orderBy: { position: 'asc' },
    });

    return rows.map(cardPrismaToDomain);
  }

  async countByColumnId(columnId: string): Promise<number> {
    return prisma.card.count({
      where: { columnId, deletedAt: null },
    });
  }

  async update(data: UpdateCardSchema): Promise<Card | null> {
    if (data.labelIds !== undefined) {
      await prisma.cardLabel.deleteMany({ where: { cardId: data.id } });

      if (data.labelIds.length > 0) {
        await prisma.cardLabel.createMany({
          data: data.labelIds.map((labelId) => ({
            cardId: data.id,
            labelId,
          })),
        });
      }
    }

    const existing = await prisma.card.findFirst({
      where: { id: data.id, boardId: data.boardId, deletedAt: null },
    });
    if (!existing) return null;

    const raw = await prisma.card.update({
      where: { id: data.id },
      data: {
        ...(data.columnId !== undefined && { columnId: data.columnId }),
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.status !== undefined && {
          status: data.status as CardStatus,
        }),
        ...(data.priority !== undefined && {
          priority: data.priority as CardPriority,
        }),
        ...(data.position !== undefined && { position: data.position }),
        ...(data.assigneeId !== undefined && {
          assigneeId: data.assigneeId,
        }),
        ...(data.startDate !== undefined && { startDate: data.startDate }),
        ...(data.dueDate !== undefined && { dueDate: data.dueDate }),
        ...(data.completedAt !== undefined && {
          completedAt: data.completedAt,
        }),
        ...(data.estimatedMinutes !== undefined && {
          estimatedMinutes: data.estimatedMinutes,
        }),
        ...(data.coverColor !== undefined && {
          coverColor: data.coverColor,
        }),
        ...(data.coverImageId !== undefined && {
          coverImageId: data.coverImageId,
        }),
        ...(data.metadata !== undefined && {
          metadata: data.metadata as Prisma.InputJsonValue,
        }),
        ...(data.archivedAt !== undefined && {
          archivedAt: data.archivedAt,
        }),
      },
    });

    return cardPrismaToDomain(raw);
  }

  async updateManyColumn(
    cardIds: string[],
    _boardId: string,
    columnId: string,
  ): Promise<void> {
    if (cardIds.length === 0) return;
    await prisma.card.updateMany({
      where: { id: { in: cardIds } },
      data: { columnId },
    });
  }

  async softDelete(id: string, _boardId: string): Promise<void> {
    await prisma.card.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async softDeleteMany(ids: string[], _boardId: string): Promise<void> {
    if (ids.length === 0) return;
    await prisma.card.updateMany({
      where: { id: { in: ids } },
      data: { deletedAt: new Date() },
    });
  }
}
