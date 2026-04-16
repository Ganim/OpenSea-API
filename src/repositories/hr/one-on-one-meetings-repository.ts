import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  OneOnOneMeeting,
  OneOnOneStatus,
} from '@/entities/hr/one-on-one-meeting';

export interface CreateOneOnOneMeetingSchema {
  tenantId: string;
  managerId: UniqueEntityID;
  reportId: UniqueEntityID;
  scheduledAt: Date;
  durationMinutes: number;
}

export interface FindOneOnOneMeetingFilters {
  participantId?: UniqueEntityID;
  managerId?: UniqueEntityID;
  reportId?: UniqueEntityID;
  status?: OneOnOneStatus;
  from?: Date;
  to?: Date;
}

export interface PaginatedOneOnOneMeetingsResult {
  meetings: OneOnOneMeeting[];
  total: number;
}

export interface OneOnOneMeetingsRepository {
  create(data: CreateOneOnOneMeetingSchema): Promise<OneOnOneMeeting>;
  findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<OneOnOneMeeting | null>;
  findManyPaginated(
    tenantId: string,
    filters: FindOneOnOneMeetingFilters,
    skip: number,
    take: number,
  ): Promise<PaginatedOneOnOneMeetingsResult>;
  save(meeting: OneOnOneMeeting): Promise<void>;
}
