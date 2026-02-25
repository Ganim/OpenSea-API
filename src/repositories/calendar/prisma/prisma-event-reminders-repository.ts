import { prisma } from '@/lib/prisma';
import { eventReminderPrismaToDomain } from '@/mappers/calendar/event-reminder/event-reminder-prisma-to-domain';
import type {
  EventRemindersRepository,
  CreateEventReminderSchema,
  DueReminderInfo,
} from '../event-reminders-repository';

export class PrismaEventRemindersRepository implements EventRemindersRepository {
  async create(data: CreateEventReminderSchema): Promise<EventReminder> {
    const raw = await prisma.eventReminder.create({
      data: {
        tenantId: data.tenantId,
        eventId: data.eventId,
        userId: data.userId,
        minutesBefore: data.minutesBefore,
      },
    });
    return eventReminderPrismaToDomain(raw);
  }

  async findByEventId(eventId: string): Promise<EventReminder[]> {
    const raws = await prisma.eventReminder.findMany({
      where: { eventId },
    });
    return raws.map(eventReminderPrismaToDomain);
  }

  async findDueReminders(now: Date): Promise<DueReminderInfo[]> {
    // Find reminders that haven't been sent yet
    // where the event start_date minus minutes_before is <= now
    const raws = await prisma.$queryRaw<any[]>`
      SELECT er.*, ce.title as event_title FROM event_reminders er
      JOIN calendar_events ce ON er.event_id = ce.id
      WHERE er.is_sent = false
      AND ce.deleted_at IS NULL
      AND (ce.start_date - (er.minutes_before * interval '1 minute')) <= ${now}
      AND ce.start_date > ${now}
    `;
    return raws.map((raw) => ({
      reminder: eventReminderPrismaToDomain(raw),
      eventTitle: raw.event_title,
    }));
  }

  async markSent(id: string): Promise<void> {
    await prisma.eventReminder.update({
      where: { id },
      data: { isSent: true, sentAt: new Date() },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.eventReminder.delete({ where: { id } });
  }

  async deleteByEventId(eventId: string): Promise<void> {
    await prisma.eventReminder.deleteMany({ where: { eventId } });
  }

  async deleteByEventAndUser(eventId: string, userId: string): Promise<void> {
    await prisma.eventReminder.deleteMany({ where: { eventId, userId } });
  }
}
