import { PrismaCalendarEventsRepository } from '@/repositories/calendar/prisma/prisma-calendar-events-repository';
import { ExportCalendarEventsUseCase } from '../export-calendar-events';

export function makeExportCalendarEventsUseCase() {
  const repository = new PrismaCalendarEventsRepository();
  return new ExportCalendarEventsUseCase(repository);
}
