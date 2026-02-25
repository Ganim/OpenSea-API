import { prisma } from '@/lib/prisma';
import { randomUUID } from 'node:crypto';

interface CreateCalendarEventOptions {
  id?: string;
  title?: string;
  description?: string | null;
  location?: string | null;
  startDate?: Date;
  endDate?: Date;
  isAllDay?: boolean;
  type?: string;
  visibility?: string;
  color?: string | null;
  rrule?: string | null;
  timezone?: string | null;
  systemSourceType?: string | null;
  systemSourceId?: string | null;
}

/**
 * Creates a calendar event directly in the database for E2E tests.
 */
export async function createCalendarEvent(
  tenantId: string,
  createdBy: string,
  overrides: CreateCalendarEventOptions = {},
) {
  const id = overrides.id ?? randomUUID();
  const now = new Date();
  const start = overrides.startDate ?? new Date(now.getTime() + 3600_000);
  const end = overrides.endDate ?? new Date(start.getTime() + 3600_000);

  const event = await prisma.calendarEvent.create({
    data: {
      id,
      tenantId,
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
  role?: string;
  status?: string;
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
