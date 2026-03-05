import { prisma } from '@/lib/prisma';
import type { CustomFieldType, Prisma } from '@prisma/generated/client.js';
import type {
  BoardCustomFieldRecord,
  BoardCustomFieldsRepository,
  CreateBoardCustomFieldSchema,
  UpdateBoardCustomFieldSchema,
} from '../board-custom-fields-repository';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toRecord(raw: any): BoardCustomFieldRecord {
  return {
    id: raw.id,
    boardId: raw.boardId,
    name: raw.name,
    type: raw.type,
    options: (raw.options as Record<string, unknown>) ?? null,
    position: raw.position,
    isRequired: raw.isRequired,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export class PrismaBoardCustomFieldsRepository
  implements BoardCustomFieldsRepository
{
  async create(
    data: CreateBoardCustomFieldSchema,
  ): Promise<BoardCustomFieldRecord> {
    const raw = await prisma.boardCustomField.create({
      data: {
        boardId: data.boardId,
        name: data.name,
        type: data.type as CustomFieldType,
        options: (data.options as Prisma.InputJsonValue) ?? undefined,
        position: data.position ?? 0,
        isRequired: data.isRequired ?? false,
      },
    });

    return toRecord(raw);
  }

  async findById(
    id: string,
    boardId: string,
  ): Promise<BoardCustomFieldRecord | null> {
    const raw = await prisma.boardCustomField.findFirst({
      where: { id, boardId },
    });

    return raw ? toRecord(raw) : null;
  }

  async findByBoardId(boardId: string): Promise<BoardCustomFieldRecord[]> {
    const rows = await prisma.boardCustomField.findMany({
      where: { boardId },
      orderBy: { position: 'asc' },
    });

    return rows.map(toRecord);
  }

  async update(
    data: UpdateBoardCustomFieldSchema,
  ): Promise<BoardCustomFieldRecord | null> {
    const raw = await prisma.boardCustomField.update({
      where: { id: data.id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.type !== undefined && {
          type: data.type as CustomFieldType,
        }),
        ...(data.options !== undefined && {
          options: data.options as Prisma.InputJsonValue,
        }),
        ...(data.position !== undefined && { position: data.position }),
        ...(data.isRequired !== undefined && {
          isRequired: data.isRequired,
        }),
      },
    });

    return toRecord(raw);
  }

  async delete(id: string, _boardId: string): Promise<void> {
    await prisma.boardCustomField.delete({
      where: { id },
    });
  }
}
