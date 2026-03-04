import { prisma } from '@/lib/prisma';
import { randomUUID } from 'node:crypto';
import type {
  EventType,
  EventVisibility,
  ParticipantRole,
  ParticipantStatus,
} from '@prisma/generated/client.js';

interface CreateCalendarEventOptions {
  id?: string;
  calendarId?: string;
  title?: string;
  description?: string | null;
  location?: string | null;
  startDate?: Date;
  endDate?: Date;
  isAllDay?: boolean;
  type?: EventType;
  visibility?: EventVisibility;
  color?: string | null;
  rrule?: string | null;
  timezone?: string | null;
  systemSourceType?: string | null;
  systemSourceId?: string | null;
}

/**
 * Creates a personal calendar for a user if it doesn't already exist.
 * Returns the calendar ID.
 */
export async function ensurePersonalCalendar(
  tenantId: string,
  userId: string,
): Promise<string> {
  const existing = await prisma.calendar.findFirst({
    where: { tenantId, type: 'PERSONAL', ownerId: userId, deletedAt: null },
  });
  if (existing) return existing.id;

  const calendar = await prisma.calendar.create({
    data: {
      tenantId,
      name: 'Meu Calendário',
      color: '#3b82f6',
      type: 'PERSONAL',
      ownerId: userId,
      isDefault: true,
      settings: {},
      createdBy: userId,
    },
  });
  return calendar.id;
}

/**
 * Creates a calendar event directly in the database for E2E tests.
 * Automatically creates a personal calendar if no calendarId is provided.
 */
export async function createCalendarEvent(
  tenantId: string,
  createdBy: string,
  overrides: CreateCalendarEventOptions = {},
) {
  const id = overrides.id ?? randomUUID();
  const calendarId =
    overrides.calendarId ?? (await ensurePersonalCalendar(tenantId, createdBy));
  const now = new Date();
  const start = overrides.startDate ?? new Date(now.getTime() + 3600_000);
  const end = overrides.endDate ?? new Date(start.getTime() + 3600_000);

  const event = await prisma.calendarEvent.create({
    data: {
      id,
      tenantId,
      calendarId,
      title: overrides.title ?? `Test Event ${Date.now()}`,
      description: overrides.description ?? null,
      location: overrides.location ?? null,
      startDate: start,
      endDate: end,
      isAllDay: overrides.isAllDay ?? false,
      type: overrides.type ?? 'CUSTOM',
      visibility: overrides.visibility ?? 'PUBLIC',
      color: overrides.color ?? null,
      rrule: overrides.rrule ?? null,
      timezone: overrides.timezone ?? null,
      systemSourceType: overrides.systemSourceType ?? null,
      systemSourceId: overrides.systemSourceId ?? null,
      metadata: {},
      createdBy,
    },
  });

  // Auto-add creator as OWNER participant
  await prisma.eventParticipant.create({
    data: {
      tenantId,
      eventId: event.id,
      userId: createdBy,
      role: 'OWNER',
      status: 'ACCEPTED',
    },
  });

  return event;
}

interface CreateEventParticipantOptions {
  role?: ParticipantRole;
  status?: ParticipantStatus;
}

/**
 * Creates an event participant directly in the database for E2E tests.
 */
export async function createEventParticipant(
  eventId: string,
  userId: string,
  tenantId: string,
  options: CreateEventParticipantOptions = {},
) {
  return prisma.eventParticipant.create({
    data: {
      tenantId,
      eventId,
      userId,
      role: options.role ?? 'GUEST',
      status: options.status ?? 'PENDING',
    },
  });
}
