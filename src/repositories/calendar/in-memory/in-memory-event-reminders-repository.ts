import { EventReminder } from '@/entities/calendar/event-reminder';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  EventRemindersRepository,
  CreateEventReminderSchema,
  DueReminderInfo,
} from '../event-reminders-repository';
import type { InMemoryCalendarEventsRepository } from './in-memory-calendar-events-repository';

export class InMemoryEventRemindersRepository
  implements EventRemindersRepository
{
  public items: EventReminder[] = [];

  constructor(private eventsRepository?: InMemoryCalendarEventsRepository) {}

  async create(data: CreateEventReminderSchema): Promise<EventReminder> {
    const reminder = EventReminder.create({
      tenantId: new UniqueEntityID(data.tenantId),
      eventId: new UniqueEntityID(data.eventId),
      userId: new UniqueEntityID(data.userId),
      minutesBefore: data.minutesBefore,
    });
    this.items.push(reminder);
    return reminder;
  }

  async findByEventId(eventId: string): Promise<EventReminder[]> {
    return this.items.filter((item) => item.eventId.toString() === eventId);
  }

  async findDueReminders(now: Date): Promise<DueReminderInfo[]> {
    const results: DueReminderInfo[] = [];

    for (const item of this.items) {
      if (item.isSent) continue;

      const event = this.eventsRepository?.items.find(
        (e) => e.id.toString() === item.eventId.toString() && !e.deletedAt,
      );

      if (!event) continue;

      // Only include if event is in the future and reminder time has passed
      if (event.startDate <= now) continue;

      const reminderTime = new Date(
        event.startDate.getTime() - item.minutesBefore * 60_000,
      );
      if (reminderTime <= now) {
        results.push({ reminder: item, eventTitle: event.title });
      }
    }

    return results;
  }

  async markSent(id: string): Promise<void> {
    const reminder = this.items.find((item) => item.id.toString() === id);
    if (reminder) {
      reminder.markSent();
    }
  }

  async delete(id: string): Promise<void> {
    this.items = this.items.filter((item) => item.id.toString() !== id);
  }

  async deleteByEventId(eventId: string): Promise<void> {
    this.items = this.items.filter(
      (item) => item.eventId.toString() !== eventId,
    );
  }

  async deleteByEventAndUser(eventId: string, userId: string): Promise<void> {
    this.items = this.items.filter(
      (item) =>
        !(
          item.eventId.toString() === eventId &&
          item.userId.toString() === userId
        ),
    );
  }
}
