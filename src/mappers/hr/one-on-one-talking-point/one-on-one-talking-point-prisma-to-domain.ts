import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { TalkingPoint as PrismaTalkingPoint } from '@prisma/generated/client.js';

export function mapOneOnOneTalkingPointPrismaToDomain(
  record: PrismaTalkingPoint,
) {
  return {
    meetingId: new UniqueEntityID(record.meetingId),
    addedByEmployeeId: new UniqueEntityID(record.addedByEmployeeId),
    content: record.content,
    isResolved: record.isResolved,
    position: record.position,
    createdAt: record.createdAt,
  };
}
