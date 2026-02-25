import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { CalendarEvent } from '@/entities/calendar/calendar-event';
import type {
  CalendarEvent as PrismaCalendarEvent,
  User,
  UserProfile,
  EventParticipant,
  EventReminder,
} from '@prisma/generated/client.js';

export type CalendarEventWithRelations = PrismaCalendarEvent & {
  creator?: (User & { profile?: UserProfile | null }) | null;
  participants?: (EventParticipant & {
    user?: (User & { profile?: UserProfile | null }) | null;
  })[];
  reminders?: EventReminder[];
};

export function calendarEventPrismaToDomain(
  raw: PrismaCalendarEvent,
): CalendarEvent {
  return CalendarEvent.create(
    {
      tenantId: new UniqueEntityID(raw.tenantId),
      title: raw.title,
      description: raw.description ?? null,
      location: raw.location ?? null,
      startDate: raw.startDate,
      endDate: raw.endDate,
      isAllDay: raw.isAllDay,
      type: raw.type,
      visibility: raw.visibility,
      color: raw.color ?? null,
      rrule: raw.rrule ?? null,
      timezone: raw.timezone ?? null,
      systemSourceType: raw.systemSourceType ?? null,
      systemSourceId: raw.systemSourceId ?? null,
      metadata: (raw.metadata as Record<string, unknown>) ?? {},
      createdBy: new UniqueEntityID(raw.createdBy),
      deletedAt: raw.deletedAt ?? null,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt ?? null,
    },
    new UniqueEntityID(raw.id),
  );
}
