import type { EventReminder } from '@/entities/calendar/event-reminder';

export interface CreateEventReminderSchema {
  tenantId: string;
  eventId: string;
  userId: string;
  minutesBefore: number;
}

export interface DueReminderInfo {
  reminder: EventReminder;
  eventTitle: string;
}

export interface EventRemindersRepository {
  create(data: CreateEventReminderSchema): Promise<EventReminder>;
  findByEventId(eventId: string): Promise<EventReminder[]>;
  findDueReminders(now: Date): Promise<DueReminderInfo[]>;
  markSent(id: string): Promise<void>;
  delete(id: string): Promise<void>;
  deleteByEventId(eventId: string): Promise<void>;
  deleteByEventAndUser(eventId: string, userId: string): Promise<void>;
}
