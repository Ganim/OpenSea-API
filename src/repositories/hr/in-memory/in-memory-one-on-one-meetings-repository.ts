import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { OneOnOneMeeting } from '@/entities/hr/one-on-one-meeting';
import type {
  CreateOneOnOneMeetingSchema,
  FindOneOnOneMeetingFilters,
  OneOnOneMeetingsRepository,
  PaginatedOneOnOneMeetingsResult,
} from '../one-on-one-meetings-repository';

export class InMemoryOneOnOneMeetingsRepository
  implements OneOnOneMeetingsRepository
{
  public items: OneOnOneMeeting[] = [];

  async create(data: CreateOneOnOneMeetingSchema): Promise<OneOnOneMeeting> {
    const meeting = OneOnOneMeeting.create({
      tenantId: new UniqueEntityID(data.tenantId),
      managerId: data.managerId,
      reportId: data.reportId,
      scheduledAt: data.scheduledAt,
      durationMinutes: data.durationMinutes,
      status: 'SCHEDULED',
    });

    this.items.push(meeting);
    return meeting;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<OneOnOneMeeting | null> {
    return (
      this.items.find(
        (meeting) =>
          meeting.id.equals(id) &&
          meeting.tenantId.toString() === tenantId &&
          meeting.deletedAt === undefined,
      ) ?? null
    );
  }

  async findManyPaginated(
    tenantId: string,
    filters: FindOneOnOneMeetingFilters,
    skip: number,
    take: number,
  ): Promise<PaginatedOneOnOneMeetingsResult> {
    let filtered = this.items.filter(
      (meeting) =>
        meeting.tenantId.toString() === tenantId &&
        meeting.deletedAt === undefined,
    );

    if (filters.participantId) {
      const participantId = filters.participantId;
      filtered = filtered.filter((meeting) =>
        meeting.isParticipant(participantId),
      );
    }
    if (filters.managerId) {
      filtered = filtered.filter((meeting) =>
        meeting.managerId.equals(filters.managerId!),
      );
    }
    if (filters.reportId) {
      filtered = filtered.filter((meeting) =>
        meeting.reportId.equals(filters.reportId!),
      );
    }
    if (filters.status) {
      filtered = filtered.filter(
        (meeting) => meeting.status === filters.status,
      );
    }
    if (filters.from) {
      filtered = filtered.filter(
        (meeting) => meeting.scheduledAt.getTime() >= filters.from!.getTime(),
      );
    }
    if (filters.to) {
      filtered = filtered.filter(
        (meeting) => meeting.scheduledAt.getTime() <= filters.to!.getTime(),
      );
    }

    const total = filtered.length;
    const meetings = filtered
      .sort((a, b) => b.scheduledAt.getTime() - a.scheduledAt.getTime())
      .slice(skip, skip + take);

    return { meetings, total };
  }

  async save(meeting: OneOnOneMeeting): Promise<void> {
    const index = this.items.findIndex((current) =>
      current.id.equals(meeting.id),
    );
    if (index >= 0) {
      this.items[index] = meeting;
    }
  }
}
