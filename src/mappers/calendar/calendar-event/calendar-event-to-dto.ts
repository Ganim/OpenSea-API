import type { CalendarEvent } from '@/entities/calendar/calendar-event';

export interface CalendarEventParticipantDTO {
  id: string;
  eventId: string;
  userId: string;
  role: string;
  status: string;
  respondedAt: Date | null;
  userName: string | null;
  userEmail: string | null;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface CalendarEventReminderDTO {
  id: string;
  eventId: string;
  userId: string;
  minutesBefore: number;
  isSent: boolean;
  sentAt: Date | null;
  createdAt: Date;
}

export interface CalendarEventDTO {
  id: string;
  tenantId: string;
  title: string;
  description: string | null;
  location: string | null;
  startDate: Date;
  endDate: Date;
  isAllDay: boolean;
  type: string;
  visibility: string;
  color: string | null;
  rrule: string | null;
  timezone: string | null;
  systemSourceType: string | null;
  systemSourceId: string | null;
  metadata: Record<string, unknown>;
  createdBy: string;
  creatorName: string | null;
  participants: CalendarEventParticipantDTO[];
  reminders: CalendarEventReminderDTO[];
  isRecurring: boolean;
  occurrenceDate: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date | null;
}

export function calendarEventToDTO(
  event: CalendarEvent,
  options?: {
    creatorName?: string | null;
    participants?: CalendarEventParticipantDTO[];
    reminders?: CalendarEventReminderDTO[];
    occurrenceDate?: Date | null;
  },
): CalendarEventDTO {
  return {
    id: event.id.toString(),
    tenantId: event.tenantId.toString(),
    title: event.title,
    description: event.description,
    location: event.location,
    startDate: event.startDate,
    endDate: event.endDate,
    isAllDay: event.isAllDay,
    type: event.type,
    visibility: event.visibility,
    color: event.color,
    rrule: event.rrule,
    timezone: event.timezone,
    systemSourceType: event.systemSourceType,
    systemSourceId: event.systemSourceId,
    metadata: event.metadata,
    createdBy: event.createdBy.toString(),
    creatorName: options?.creatorName ?? null,
    participants: options?.participants ?? [],
    reminders: options?.reminders ?? [],
    isRecurring: event.isRecurring,
    occurrenceDate: options?.occurrenceDate ?? null,
    deletedAt: event.deletedAt,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
  };
}
