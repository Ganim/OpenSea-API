import { PrismaCalendarEventsRepository } from '@/repositories/calendar/prisma/prisma-calendar-events-repository';
import { PrismaCalendarsRepository } from '@/repositories/calendar/prisma/prisma-calendars-repository';
import { CreateCalendarEventUseCase } from '../create-calendar-event';

export function makeCreateCalendarEventUseCase() {
  const eventsRepository = new PrismaCalendarEventsRepository();
  const calendarsRepository = new PrismaCalendarsRepository();
  return new CreateCalendarEventUseCase(eventsRepository, calendarsRepository);
}
