import { prisma } from '@/lib/prisma';
import type {
  BoardColumnRecord,
  BoardColumnsRepository,
  CreateBoardColumnSchema,
  UpdateBoardColumnSchema,
} from '../board-columns-repository';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toRecord(raw: any): BoardColumnRecord {
  return {
    id: raw.id,
    boardId: raw.boardId,
    title: raw.title,
    color: raw.color,
    position: raw.position,
    isDefault: raw.isDefault,
    isDone: raw.isDone,
    wipLimit: raw.wipLimit,
    archivedAt: raw.archivedAt,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export class PrismaBoardColumnsRepository implements BoardColumnsRepository {
  async create(data: CreateBoardColumnSchema): Promise<BoardColumnRecord> {
    const raw = await prisma.boardColumn.create({
      data: {
        boardId: data.boardId,
        title: data.title,
        color: data.color,
        position: data.position ?? 0,
        isDefault: data.isDefault ?? false,
        isDone: data.isDone ?? false,
        wipLimit: data.wipLimit,
      },
    });

    return toRecord(raw);
  }

  async findById(
    id: string,
    boardId: string,
  ): Promise<BoardColumnRecord | null> {
    const raw = await prisma.boardColumn.findFirst({
      where: { id, boardId },
    });

    return raw ? toRecord(raw) : null;
  }

  async findByBoardId(boardId: string): Promise<BoardColumnRecord[]> {
    const rows = await prisma.boardColumn.findMany({
      where: { boardId },
      orderBy: { position: 'asc' },
    });

    return rows.map(toRecord);
  }

  async findDefaultColumn(
    boardId: string,
  ): Promise<BoardColumnRecord | null> {
    const raw = await prisma.boardColumn.findFirst({
      where: { boardId, isDefault: true },
    });

    return raw ? toRecord(raw) : null;
  }

  async findDoneColumn(boardId: string): Promise<BoardColumnRecord | null> {
    const raw = await prisma.boardColumn.findFirst({
      where: { boardId, isDone: true },
    });

    return raw ? toRecord(raw) : null;
  }

  async update(
    data: UpdateBoardColumnSchema,
  ): Promise<BoardColumnRecord | null> {
    const raw = await prisma.boardColumn.update({
      where: { id: data.id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.color !== undefined && { color: data.color }),
        ...(data.position !== undefined && { position: data.position }),
        ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
        ...(data.isDone !== undefined && { isDone: data.isDone }),
        ...(data.wipLimit !== undefined && { wipLimit: data.wipLimit }),
      },
    });

    return toRecord(raw);
  }

  async archive(id: string, _boardId: string): Promise<void> {
    await prisma.boardColumn.update({
      where: { id },
      data: { archivedAt: new Date() },
    });
  }

  async restore(id: string, _boardId: string): Promise<void> {
    await prisma.boardColumn.update({
      where: { id },
      data: { archivedAt: null },
    });
  }

  async delete(id: string, _boardId: string): Promise<void> {
    await prisma.boardColumn.delete({
      where: { id },
    });
  }

  async reorder(
    id: string,
    _boardId: string,
    newPosition: number,
  ): Promise<void> {
    await prisma.boardColumn.update({
      where: { id },
      data: { position: newPosition },
    });
  }
}
