import { PrismaCalendarEventsRepository } from '@/repositories/calendar/prisma/prisma-calendar-events-repository';
import { PrismaCalendarsRepository } from '@/repositories/calendar/prisma/prisma-calendars-repository';
import { ExportCalendarEventsUseCase } from '../export-calendar-events';

export function makeExportCalendarEventsUseCase() {
  return new ExportCalendarEventsUseCase(
    new PrismaCalendarEventsRepository(),
    new PrismaCalendarsRepository(),
  );
}
