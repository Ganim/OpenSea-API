import { prisma } from '@/lib/prisma';
import type {
  CardChecklistRecord,
  CardChecklistsRepository,
  ChecklistItemRecord,
  CreateCardChecklistSchema,
  CreateChecklistItemSchema,
  UpdateCardChecklistSchema,
  UpdateChecklistItemSchema,
} from '../card-checklists-repository';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toItemRecord(raw: any): ChecklistItemRecord {
  return {
    id: raw.id,
    checklistId: raw.checklistId,
    title: raw.title,
    isCompleted: raw.isCompleted,
    assigneeId: raw.assigneeId,
    dueDate: raw.dueDate,
    position: raw.position,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toRecord(raw: any): CardChecklistRecord {
  return {
    id: raw.id,
    cardId: raw.cardId,
    title: raw.title,
    position: raw.position,
    createdAt: raw.createdAt,
    items: (raw.items ?? []).map(toItemRecord),
  };
}

const itemsInclude = {
  items: { orderBy: { position: 'asc' as const } },
} as const;

export class PrismaCardChecklistsRepository
  implements CardChecklistsRepository
{
  async create(data: CreateCardChecklistSchema): Promise<CardChecklistRecord> {
    const raw = await prisma.cardChecklist.create({
      data: {
        cardId: data.cardId,
        title: data.title,
        position: data.position ?? 0,
      },
      include: itemsInclude,
    });

    return toRecord(raw);
  }

  async findById(
    id: string,
    cardId: string,
  ): Promise<CardChecklistRecord | null> {
    const raw = await prisma.cardChecklist.findFirst({
      where: { id, cardId },
      include: itemsInclude,
    });

    return raw ? toRecord(raw) : null;
  }

  async findByCardId(cardId: string): Promise<CardChecklistRecord[]> {
    const rows = await prisma.cardChecklist.findMany({
      where: { cardId },
      include: itemsInclude,
      orderBy: { position: 'asc' },
    });

    return rows.map(toRecord);
  }

  async update(
    data: UpdateCardChecklistSchema,
  ): Promise<CardChecklistRecord | null> {
    const raw = await prisma.cardChecklist.update({
      where: { id: data.id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.position !== undefined && { position: data.position }),
      },
      include: itemsInclude,
    });

    return toRecord(raw);
  }

  async delete(id: string, _cardId: string): Promise<void> {
    await prisma.cardChecklist.delete({
      where: { id },
    });
  }

  async addItem(data: CreateChecklistItemSchema): Promise<ChecklistItemRecord> {
    const raw = await prisma.checklistItem.create({
      data: {
        checklistId: data.checklistId,
        title: data.title,
        isCompleted: data.isCompleted ?? false,
        assigneeId: data.assigneeId,
        dueDate: data.dueDate,
        position: data.position ?? 0,
      },
    });

    return toItemRecord(raw);
  }

  async findItemById(
    id: string,
    checklistId: string,
  ): Promise<ChecklistItemRecord | null> {
    const raw = await prisma.checklistItem.findFirst({
      where: { id, checklistId },
    });

    return raw ? toItemRecord(raw) : null;
  }

  async findItemsByChecklistId(
    checklistId: string,
  ): Promise<ChecklistItemRecord[]> {
    const rows = await prisma.checklistItem.findMany({
      where: { checklistId },
      orderBy: { position: 'asc' },
    });

    return rows.map(toItemRecord);
  }

  async updateItem(
    data: UpdateChecklistItemSchema,
  ): Promise<ChecklistItemRecord | null> {
    const raw = await prisma.checklistItem.update({
      where: { id: data.id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.isCompleted !== undefined && {
          isCompleted: data.isCompleted,
        }),
        ...(data.assigneeId !== undefined && {
          assigneeId: data.assigneeId,
        }),
        ...(data.dueDate !== undefined && { dueDate: data.dueDate }),
        ...(data.position !== undefined && { position: data.position }),
      },
    });

    return toItemRecord(raw);
  }

  async deleteItem(id: string, _checklistId: string): Promise<void> {
    await prisma.checklistItem.delete({
      where: { id },
    });
  }
}
