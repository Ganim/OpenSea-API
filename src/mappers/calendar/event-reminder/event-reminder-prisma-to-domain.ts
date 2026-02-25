import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { EventReminder } from '@/entities/calendar/event-reminder';
import type { EventReminder as PrismaEventReminder } from '@prisma/generated/client.js';

export function eventReminderPrismaToDomain(
  raw: PrismaEventReminder,
): EventReminder {
  return EventReminder.create(
    {
      tenantId: new UniqueEntityID(raw.tenantId),
      eventId: new UniqueEntityID(raw.eventId),
      userId: new UniqueEntityID(raw.userId),
      minutesBefore: raw.minutesBefore,
      isSent: raw.isSent,
      sentAt: raw.sentAt ?? null,
      createdAt: raw.createdAt,
    },
    new UniqueEntityID(raw.id),
  );
}
