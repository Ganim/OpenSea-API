import type { Board } from '@/entities/tasks/board';
import { prisma } from '@/lib/prisma';
import { boardPrismaToDomain } from '@/mappers/tasks/board/board-prisma-to-domain';
import type {
  BoardsRepository,
  CreateBoardSchema,
  FindManyBoardsOptions,
  FindManyBoardsResult,
  UpdateBoardSchema,
} from '../boards-repository';
import type {
  BoardType,
  BoardView,
  BoardVisibility,
  Prisma,
} from '@prisma/generated/client.js';

export class PrismaBoardsRepository implements BoardsRepository {
  async create(data: CreateBoardSchema): Promise<Board> {
    const raw = await prisma.board.create({
      data: {
        tenantId: data.tenantId,
        title: data.title,
        description: data.description,
        type: (data.type as BoardType) ?? 'PERSONAL',
        teamId: data.teamId,
        ownerId: data.ownerId,
        storageFolderId: data.storageFolderId,
        visibility: (data.visibility as BoardVisibility) ?? 'PRIVATE',
        defaultView: (data.defaultView as BoardView) ?? 'KANBAN',
        settings: (data.settings as Prisma.InputJsonValue) ?? undefined,
        metadata: (data.metadata as Prisma.InputJsonValue) ?? undefined,
        position: data.position ?? 0,
      },
    });

    return boardPrismaToDomain(raw);
  }

  async findById(id: string, tenantId: string): Promise<Board | null> {
    const raw = await prisma.board.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    return raw ? boardPrismaToDomain(raw) : null;
  }

  async findMany(
    options: FindManyBoardsOptions,
  ): Promise<FindManyBoardsResult> {
    const {
      tenantId,
      userId,
      type,
      teamId,
      search,
      includeArchived,
      page = 1,
      limit = 20,
    } = options;

    const where: Prisma.BoardWhereInput = {
      tenantId,
      deletedAt: null,
      ...(!includeArchived && { archivedAt: null }),
      ...(type && { type: type as BoardType }),
      ...(teamId && { teamId }),
      ...(search && {
        title: { contains: search, mode: 'insensitive' },
      }),
      OR: [
        { ownerId: userId },
        { members: { some: { userId } } },
        { visibility: 'SHARED' },
      ],
    };

    const [boards, total] = await Promise.all([
      prisma.board.findMany({
        where,
        orderBy: { position: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.board.count({ where }),
    ]);

    return { boards: boards.map(boardPrismaToDomain), total };
  }

  async findByTeamId(teamId: string, tenantId: string): Promise<Board[]> {
    const boards = await prisma.board.findMany({
      where: { teamId, tenantId, deletedAt: null },
      orderBy: { position: 'asc' },
    });

    return boards.map(boardPrismaToDomain);
  }

  async update(data: UpdateBoardSchema): Promise<Board | null> {
    const existing = await prisma.board.findFirst({
      where: { id: data.id, tenantId: data.tenantId },
    });
    if (!existing) return null;

    const raw = await prisma.board.update({
      where: { id: data.id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.visibility !== undefined && {
          visibility: data.visibility as BoardVisibility,
        }),
        ...(data.defaultView !== undefined && {
          defaultView: data.defaultView as BoardView,
        }),
        ...(data.storageFolderId !== undefined && {
          storageFolderId: data.storageFolderId,
        }),
        ...(data.settings !== undefined && {
          settings: data.settings as Prisma.InputJsonValue,
        }),
        ...(data.metadata !== undefined && {
          metadata: data.metadata as Prisma.InputJsonValue,
        }),
        ...(data.position !== undefined && { position: data.position }),
      },
    });

    return boardPrismaToDomain(raw);
  }

  async archive(id: string, _tenantId: string): Promise<void> {
    await prisma.board.update({
      where: { id },
      data: { archivedAt: new Date() },
    });
  }

  async restore(id: string, _tenantId: string): Promise<void> {
    await prisma.board.update({
      where: { id },
      data: { archivedAt: null },
    });
  }

  async softDelete(id: string, _tenantId: string): Promise<void> {
    await prisma.board.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async reorder(
    id: string,
    _tenantId: string,
    newPosition: number,
  ): Promise<void> {
    await prisma.board.update({
      where: { id },
      data: { position: newPosition },
    });
  }
}
