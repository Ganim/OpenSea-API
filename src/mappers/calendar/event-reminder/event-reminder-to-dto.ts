import type { EventReminder } from '@/entities/calendar/event-reminder';
import type { CalendarEventReminderDTO } from '../calendar-event/calendar-event-to-dto';

export function eventReminderToDTO(
  reminder: EventReminder,
): CalendarEventReminderDTO {
  return {
    id: reminder.id.toString(),
    eventId: reminder.eventId.toString(),
    userId: reminder.userId.toString(),
    minutesBefore: reminder.minutesBefore,
    isSent: reminder.isSent,
    sentAt: reminder.sentAt,
    createdAt: reminder.createdAt,
  };
}
