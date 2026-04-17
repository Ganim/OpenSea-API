import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { OneOnOneTalkingPoint } from '@/entities/hr/one-on-one-talking-point';

export interface CreateOneOnOneTalkingPointSchema {
  meetingId: UniqueEntityID;
  addedByEmployeeId: UniqueEntityID;
  content: string;
  position?: number;
}

export interface OneOnOneTalkingPointsRepository {
  create(data: CreateOneOnOneTalkingPointSchema): Promise<OneOnOneTalkingPoint>;
  findById(id: UniqueEntityID): Promise<OneOnOneTalkingPoint | null>;
  findManyByMeeting(meetingId: UniqueEntityID): Promise<OneOnOneTalkingPoint[]>;
  save(point: OneOnOneTalkingPoint): Promise<void>;
  delete(id: UniqueEntityID, tenantId?: string): Promise<void>;
  countByMeeting(meetingId: UniqueEntityID): Promise<number>;
}
