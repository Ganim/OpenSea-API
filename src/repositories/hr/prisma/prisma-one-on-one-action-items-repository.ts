import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { OneOnOneActionItem } from '@/entities/hr/one-on-one-action-item';
import { prisma } from '@/lib/prisma';
import { mapOneOnOneActionItemPrismaToDomain } from '@/mappers/hr/one-on-one-action-item';
import type {
  CreateOneOnOneActionItemSchema,
  OneOnOneActionItemsRepository,
} from '../one-on-one-action-items-repository';

export class PrismaOneOnOneActionItemsRepository
  implements OneOnOneActionItemsRepository
{
  async create(
    data: CreateOneOnOneActionItemSchema,
  ): Promise<OneOnOneActionItem> {
    const record = await prisma.oneOnOneActionItem.create({
      data: {
        meetingId: data.meetingId.toString(),
        ownerId: data.ownerId.toString(),
        content: data.content,
        dueDate: data.dueDate ?? null,
        isCompleted: false,
      },
    });

    return OneOnOneActionItem.create(
      mapOneOnOneActionItemPrismaToDomain(record),
      new UniqueEntityID(record.id),
    );
  }

  async findById(id: UniqueEntityID): Promise<OneOnOneActionItem | null> {
    const record = await prisma.oneOnOneActionItem.findUnique({
      where: { id: id.toString() },
    });

    if (!record) return null;

    return OneOnOneActionItem.create(
      mapOneOnOneActionItemPrismaToDomain(record),
      new UniqueEntityID(record.id),
    );
  }

  async findManyByMeeting(
    meetingId: UniqueEntityID,
  ): Promise<OneOnOneActionItem[]> {
    const records = await prisma.oneOnOneActionItem.findMany({
      where: { meetingId: meetingId.toString() },
      orderBy: { createdAt: 'asc' },
    });

    return records.map((record) =>
      OneOnOneActionItem.create(
        mapOneOnOneActionItemPrismaToDomain(record),
        new UniqueEntityID(record.id),
      ),
    );
  }

  async save(item: OneOnOneActionItem): Promise<void> {
    await prisma.oneOnOneActionItem.update({
      where: { id: item.id.toString(), tenantId: item.tenantId.toString(), },
      data: {
        content: item.content,
        ownerId: item.ownerId.toString(),
        isCompleted: item.isCompleted,
        dueDate: item.dueDate ?? null,
        completedAt: item.completedAt ?? null,
        updatedAt: item.updatedAt,
      },
    });
  }

  async delete(id: UniqueEntityID, tenantId?: string): Promise<void> {
    await prisma.oneOnOneActionItem.delete({ where: { id: id.toString(), ...(tenantId && { tenantId }), } });
  }
}
