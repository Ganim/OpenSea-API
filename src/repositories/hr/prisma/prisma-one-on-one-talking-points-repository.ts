import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { OneOnOneTalkingPoint } from '@/entities/hr/one-on-one-talking-point';
import { prisma } from '@/lib/prisma';
import { mapOneOnOneTalkingPointPrismaToDomain } from '@/mappers/hr/one-on-one-talking-point';
import type {
  CreateOneOnOneTalkingPointSchema,
  OneOnOneTalkingPointsRepository,
} from '../one-on-one-talking-points-repository';

export class PrismaOneOnOneTalkingPointsRepository
  implements OneOnOneTalkingPointsRepository
{
  async create(
    data: CreateOneOnOneTalkingPointSchema,
  ): Promise<OneOnOneTalkingPoint> {
    const position =
      data.position ?? (await this.countByMeeting(data.meetingId));

    const record = await prisma.talkingPoint.create({
      data: {
        meetingId: data.meetingId.toString(),
        addedByEmployeeId: data.addedByEmployeeId.toString(),
        content: data.content,
        position,
        isResolved: false,
      },
    });

    return OneOnOneTalkingPoint.create(
      mapOneOnOneTalkingPointPrismaToDomain(record),
      new UniqueEntityID(record.id),
    );
  }

  async findById(id: UniqueEntityID): Promise<OneOnOneTalkingPoint | null> {
    const record = await prisma.talkingPoint.findUnique({
      where: { id: id.toString() },
    });

    if (!record) return null;

    return OneOnOneTalkingPoint.create(
      mapOneOnOneTalkingPointPrismaToDomain(record),
      new UniqueEntityID(record.id),
    );
  }

  async findManyByMeeting(
    meetingId: UniqueEntityID,
  ): Promise<OneOnOneTalkingPoint[]> {
    const records = await prisma.talkingPoint.findMany({
      where: { meetingId: meetingId.toString() },
      orderBy: { position: 'asc' },
    });

    return records.map((record) =>
      OneOnOneTalkingPoint.create(
        mapOneOnOneTalkingPointPrismaToDomain(record),
        new UniqueEntityID(record.id),
      ),
    );
  }

  async save(point: OneOnOneTalkingPoint): Promise<void> {
    await prisma.talkingPoint.update({
      where: { id: point.id.toString(), tenantId: point.tenantId.toString() },
      data: {
        content: point.content,
        isResolved: point.isResolved,
        position: point.position,
      },
    });
  }

  async delete(id: UniqueEntityID, tenantId?: string): Promise<void> {
    await prisma.talkingPoint.delete({
      where: { id: id.toString(), ...(tenantId && { tenantId }) },
    });
  }

  async countByMeeting(meetingId: UniqueEntityID): Promise<number> {
    return prisma.talkingPoint.count({
      where: { meetingId: meetingId.toString() },
    });
  }
}
