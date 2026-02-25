import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { EventParticipant } from '@/entities/calendar/event-participant';
import type { EventParticipant as PrismaEventParticipant } from '@prisma/generated/client.js';

export function eventParticipantPrismaToDomain(
  raw: PrismaEventParticipant,
): EventParticipant {
  return EventParticipant.create(
    {
      tenantId: new UniqueEntityID(raw.tenantId),
      eventId: new UniqueEntityID(raw.eventId),
      userId: new UniqueEntityID(raw.userId),
      role: raw.role,
      status: raw.status,
      respondedAt: raw.respondedAt ?? null,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt ?? null,
    },
    new UniqueEntityID(raw.id),
  );
}
