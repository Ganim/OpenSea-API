import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/lib/logger', () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

import { ProcessDueRemindersUseCase } from './process-due-reminders';
import { InMemoryCalendarEventsRepository } from '@/repositories/calendar/in-memory/in-memory-calendar-events-repository';
import { InMemoryEventRemindersRepository } from '@/repositories/calendar/in-memory/in-memory-event-reminders-repository';
import { InMemoryNotificationsRepository } from '@/repositories/notifications/in-memory/in-memory-notifications-repository';
import { InMemoryNotificationTemplatesRepository } from '@/repositories/notifications/in-memory/in-memory-notification-templates-repository';

let eventsRepo: InMemoryCalendarEventsRepository;
let remindersRepo: InMemoryEventRemindersRepository;
let notificationsRepo: InMemoryNotificationsRepository;
let templatesRepo: InMemoryNotificationTemplatesRepository;
let sut: ProcessDueRemindersUseCase;

describe('ProcessDueRemindersUseCase', () => {
  beforeEach(async () => {
    eventsRepo = new InMemoryCalendarEventsRepository();
    remindersRepo = new InMemoryEventRemindersRepository(eventsRepo);
    notificationsRepo = new InMemoryNotificationsRepository();
    templatesRepo = new InMemoryNotificationTemplatesRepository();
    sut = new ProcessDueRemindersUseCase(
      remindersRepo,
      notificationsRepo,
      templatesRepo,
    );

    await templatesRepo.create({
      code: 'calendar.event.reminder',
      name: 'Calendar Event Reminder',
      titleTemplate: 'Lembrete de evento',
      messageTemplate: 'Lembrete: "{{eventTitle}}" começa em {{minutesBefore}} minutos',
      defaultChannel: 'IN_APP',
    });

    // Event starts in 10 minutes from "now"
    const eventStart = new Date('2026-03-01T10:00:00');

    await eventsRepo.create({
      tenantId: 'tenant-1',
      title: 'Team Meeting',
      startDate: eventStart,
      endDate: new Date('2026-03-01T11:00:00'),
      createdBy: 'user-owner',
    });

    const eventId = eventsRepo.items[0].id.toString();

    // 15-minute reminder → due at 09:45 (now=09:50 → due)
    await remindersRepo.create({
      eventId,
      userId: 'user-owner',
      minutesBefore: 15,
    });

    // 30-minute reminder → due at 09:30 (now=09:50 → due)
    await remindersRepo.create({
      eventId,
      userId: 'user-guest',
      minutesBefore: 30,
    });
  });

  it('should process due reminders and create notifications', async () => {
    // Now is 09:50, both reminders are due (15min→09:45, 30min→09:30)
    const now = new Date('2026-03-01T09:50:00');
    const result = await sut.execute({ now });

    expect(result.processed).toBe(2);
    expect(result.errors).toBe(0);
    expect(notificationsRepo.items).toHaveLength(2);
    expect(remindersRepo.items[0].isSent).toBe(true);
    expect(remindersRepo.items[1].isSent).toBe(true);
  });

  it('should use actual event title in notification', async () => {
    const now = new Date('2026-03-01T09:50:00');
    await sut.execute({ now });

    const notification = notificationsRepo.items[0];
    expect(notification.message).toContain('Team Meeting');
  });

  it('should not process reminders that are not yet due', async () => {
    // Now is 08:00, 15min reminder due at 09:45, 30min at 09:30 → neither is due
    const now = new Date('2026-03-01T08:00:00');
    const result = await sut.execute({ now });

    expect(result.processed).toBe(0);
    expect(notificationsRepo.items).toHaveLength(0);
  });

  it('should not process reminders for past events', async () => {
    // Now is after the event already started
    const now = new Date('2026-03-01T10:30:00');
    const result = await sut.execute({ now });

    expect(result.processed).toBe(0);
    expect(notificationsRepo.items).toHaveLength(0);
  });

  it('should not process already sent reminders', async () => {
    const now = new Date('2026-03-01T09:50:00');

    // Process first time
    await sut.execute({ now });
    expect(notificationsRepo.items).toHaveLength(2);

    // Process again - should find nothing
    const result = await sut.execute({ now });
    expect(result.processed).toBe(0);
    expect(notificationsRepo.items).toHaveLength(2); // still 2
  });

  it('should respect batch size', async () => {
    const now = new Date('2026-03-01T09:50:00');
    const result = await sut.execute({ now, batchSize: 1 });

    expect(result.processed).toBe(1);
    expect(notificationsRepo.items).toHaveLength(1);
  });
});
