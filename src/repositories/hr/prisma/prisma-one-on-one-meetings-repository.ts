import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { OneOnOneMeeting } from '@/entities/hr/one-on-one-meeting';
import { prisma } from '@/lib/prisma';
import { mapOneOnOneMeetingPrismaToDomain } from '@/mappers/hr/one-on-one-meeting';
import type {
  CreateOneOnOneMeetingSchema,
  FindOneOnOneMeetingFilters,
  OneOnOneMeetingsRepository,
  PaginatedOneOnOneMeetingsResult,
} from '../one-on-one-meetings-repository';

export class PrismaOneOnOneMeetingsRepository
  implements OneOnOneMeetingsRepository
{
  async create(data: CreateOneOnOneMeetingSchema): Promise<OneOnOneMeeting> {
    const record = await prisma.oneOnOneMeeting.create({
      data: {
        tenantId: data.tenantId,
        managerId: data.managerId.toString(),
        reportId: data.reportId.toString(),
        scheduledAt: data.scheduledAt,
        durationMinutes: data.durationMinutes,
        status: 'SCHEDULED',
      },
    });

    return OneOnOneMeeting.create(
      mapOneOnOneMeetingPrismaToDomain(record),
      new UniqueEntityID(record.id),
    );
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<OneOnOneMeeting | null> {
    const record = await prisma.oneOnOneMeeting.findFirst({
      where: {
        id: id.toString(),
        tenantId,
        deletedAt: null,
      },
    });

    if (!record) return null;

    return OneOnOneMeeting.create(
      mapOneOnOneMeetingPrismaToDomain(record),
      new UniqueEntityID(record.id),
    );
  }

  async findManyPaginated(
    tenantId: string,
    filters: FindOneOnOneMeetingFilters,
    skip: number,
    take: number,
  ): Promise<PaginatedOneOnOneMeetingsResult> {
    const participantClause = filters.participantId
      ? {
          OR: [
            { managerId: filters.participantId.toString() },
            { reportId: filters.participantId.toString() },
          ],
        }
      : undefined;

    const whereClause = {
      tenantId,
      deletedAt: null,
      managerId: filters.managerId?.toString(),
      reportId: filters.reportId?.toString(),
      status: filters.status,
      scheduledAt: {
        ...(filters.from ? { gte: filters.from } : {}),
        ...(filters.to ? { lte: filters.to } : {}),
      },
      ...(participantClause ?? {}),
    };

    if (!filters.from && !filters.to) {
      delete (whereClause as { scheduledAt?: unknown }).scheduledAt;
    }

    const [records, total] = await Promise.all([
      prisma.oneOnOneMeeting.findMany({
        where: whereClause,
        orderBy: { scheduledAt: 'desc' },
        skip,
        take,
      }),
      prisma.oneOnOneMeeting.count({ where: whereClause }),
    ]);

    const meetings = records.map((record) =>
      OneOnOneMeeting.create(
        mapOneOnOneMeetingPrismaToDomain(record),
        new UniqueEntityID(record.id),
      ),
    );

    return { meetings, total };
  }

  async save(meeting: OneOnOneMeeting): Promise<void> {
    await prisma.oneOnOneMeeting.update({
      where: { id: meeting.id.toString(), tenantId: meeting.tenantId.toString(), },
      data: {
        scheduledAt: meeting.scheduledAt,
        durationMinutes: meeting.durationMinutes,
        status: meeting.status,
        privateNotesManager: meeting.privateNotesManager ?? null,
        privateNotesReport: meeting.privateNotesReport ?? null,
        sharedNotes: meeting.sharedNotes ?? null,
        cancelledReason: meeting.cancelledReason ?? null,
        deletedAt: meeting.deletedAt ?? null,
        updatedAt: meeting.updatedAt,
      },
    });
  }
}
