import type { CalendarEvent } from '@/entities/calendar/calendar-event';

export interface CreateCalendarEventSchema {
  tenantId: string;
  calendarId: string;
  title: string;
  description?: string | null;
  location?: string | null;
  startDate: Date;
  endDate: Date;
  isAllDay?: boolean;
  type?: string;
  visibility?: string;
  color?: string | null;
  rrule?: string | null;
  timezone?: string | null;
  systemSourceType?: string | null;
  systemSourceId?: string | null;
  metadata?: Record<string, unknown>;
  createdBy: string;
  participants?: { userId: string; role?: string }[];
  reminders?: { userId: string; minutesBefore: number }[];
}

export interface UpdateCalendarEventSchema {
  id: string;
  tenantId: string;
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
  metadata?: Record<string, unknown>;
}

export interface FindManyCalendarEventsOptions {
  tenantId: string;
  userId: string;
  startDate: Date;
  endDate: Date;
  type?: string;
  search?: string;
  includeSystemEvents?: boolean;
  calendarIds?: string[];
  page?: number;
  limit?: number;
}

export interface FindManyCalendarEventsResult {
  events: CalendarEvent[];
  total: number;
}

export interface EventParticipantRelation {
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

export interface EventReminderRelation {
  id: string;
  eventId: string;
  userId: string;
  minutesBefore: number;
  isSent: boolean;
  sentAt: Date | null;
  createdAt: Date;
}

export interface CalendarEventWithRelations {
  event: CalendarEvent;
  creatorName: string | null;
  participants: EventParticipantRelation[];
  reminders: EventReminderRelation[];
}

export interface FindManyWithRelationsResult {
  events: CalendarEventWithRelations[];
  total: number;
}

export interface CalendarEventsRepository {
  create(data: CreateCalendarEventSchema): Promise<CalendarEvent>;
  findById(id: string, tenantId: string): Promise<CalendarEvent | null>;
  findByIdWithRelations(
    id: string,
    tenantId: string,
  ): Promise<CalendarEventWithRelations | null>;
  findMany(
    options: FindManyCalendarEventsOptions,
  ): Promise<FindManyCalendarEventsResult>;
  findManyWithRelations(
    options: FindManyCalendarEventsOptions,
  ): Promise<FindManyWithRelationsResult>;
  findBySystemSource(
    tenantId: string,
    sourceType: string,
    sourceId: string,
  ): Promise<CalendarEvent | null>;
  update(data: UpdateCalendarEventSchema): Promise<CalendarEvent | null>;
  softDelete(id: string, tenantId: string): Promise<void>;
}
