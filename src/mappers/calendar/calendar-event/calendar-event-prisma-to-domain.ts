import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { CalendarEvent } from '@/entities/calendar/calendar-event';
import type {
  CalendarEvent as PrismaCalendarEvent,
  EventParticipant,
  EventReminder,
} from '@prisma/generated/client.js';

export type CalendarEventCreator = {
  id: string;
  email: string;
  username: string | null;
  profile?: { name: string; surname: string; avatarUrl?: string | null } | null;
};

export type CalendarEventWithRelations = PrismaCalendarEvent & {
  creator?: CalendarEventCreator | null;
  participants?: (EventParticipant & {
    user?: CalendarEventCreator | null;
  })[];
  reminders?: EventReminder[];
};

export function calendarEventPrismaToDomain(
  raw: PrismaCalendarEvent,
): CalendarEvent {
  return CalendarEvent.create(
    {
      tenantId: new UniqueEntityID(raw.tenantId),
      calendarId: raw.calendarId ?? null,
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

export function extractRelationsFromPrisma(raw: CalendarEventWithRelations) {
  const creatorName = raw.creator
    ? raw.creator.profile
      ? `${raw.creator.profile.name ?? ''} ${raw.creator.profile.surname ?? ''}`.trim() ||
        raw.creator.username ||
        raw.creator.email
      : raw.creator.username || raw.creator.email
    : null;

  const participants = (raw.participants ?? []).map((p) => {
    const userName = p.user
      ? p.user.profile
        ? `${p.user.profile.name ?? ''} ${p.user.profile.surname ?? ''}`.trim() ||
          p.user.username ||
          null
        : p.user.username || null
      : null;
    const userEmail = p.user?.email ?? null;
    const userAvatarUrl = p.user?.profile?.avatarUrl ?? null;

    return {
      id: p.id,
      eventId: p.eventId,
      userId: p.userId,
      role: p.role,
      status: p.status,
      respondedAt: p.respondedAt,
      userName,
      userEmail,
      userAvatarUrl,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  });

  const reminders = (raw.reminders ?? []).map((r) => ({
    id: r.id,
    eventId: r.eventId,
    userId: r.userId,
    minutesBefore: r.minutesBefore,
    isSent: r.isSent,
    sentAt: r.sentAt,
    createdAt: r.createdAt,
  }));

  return { creatorName, participants, reminders };
}
