import { prisma } from '@/lib/prisma';
import type {
  BoardLabelRecord,
  BoardLabelsRepository,
  CreateBoardLabelSchema,
  UpdateBoardLabelSchema,
} from '../board-labels-repository';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toRecord(raw: any): BoardLabelRecord {
  return {
    id: raw.id,
    boardId: raw.boardId,
    name: raw.name,
    color: raw.color,
    position: raw.position,
    createdAt: raw.createdAt,
  };
}

export class PrismaBoardLabelsRepository implements BoardLabelsRepository {
  async create(data: CreateBoardLabelSchema): Promise<BoardLabelRecord> {
    const raw = await prisma.boardLabel.create({
      data: {
        boardId: data.boardId,
        name: data.name,
        color: data.color,
        position: data.position ?? 0,
      },
    });

    return toRecord(raw);
  }

  async findById(
    id: string,
    boardId: string,
  ): Promise<BoardLabelRecord | null> {
    const raw = await prisma.boardLabel.findFirst({
      where: { id, boardId },
    });

    return raw ? toRecord(raw) : null;
  }

  async findByBoardId(boardId: string): Promise<BoardLabelRecord[]> {
    const rows = await prisma.boardLabel.findMany({
      where: { boardId },
      orderBy: { position: 'asc' },
    });

    return rows.map(toRecord);
  }

  async update(
    data: UpdateBoardLabelSchema,
  ): Promise<BoardLabelRecord | null> {
    const raw = await prisma.boardLabel.update({
      where: { id: data.id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.color !== undefined && { color: data.color }),
        ...(data.position !== undefined && { position: data.position }),
      },
    });

    return toRecord(raw);
  }

  async delete(id: string, _boardId: string): Promise<void> {
    await prisma.boardLabel.delete({
      where: { id },
    });
  }
}
