import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { CalendarEvent } from '@/entities/calendar/calendar-event';

export interface CreateCalendarEventSchema {
  tenantId: string;
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
  page?: number;
  limit?: number;
}

export interface FindManyCalendarEventsResult {
  events: CalendarEvent[];
  total: number;
}

export interface CalendarEventsRepository {
  create(data: CreateCalendarEventSchema): Promise<CalendarEvent>;
  findById(id: string, tenantId: string): Promise<CalendarEvent | null>;
  findMany(options: FindManyCalendarEventsOptions): Promise<FindManyCalendarEventsResult>;
  findBySystemSource(tenantId: string, sourceType: string, sourceId: string): Promise<CalendarEvent | null>;
  update(data: UpdateCalendarEventSchema): Promise<CalendarEvent | null>;
  softDelete(id: string, tenantId: string): Promise<void>;
}
