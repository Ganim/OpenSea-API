import { PrismaCalendarEventsRepository } from '@/repositories/calendar/prisma/prisma-calendar-events-repository';
import { UpdateCalendarEventUseCase } from '../update-calendar-event';

export function makeUpdateCalendarEventUseCase() {
  const repository = new PrismaCalendarEventsRepository();
  return new UpdateCalendarEventUseCase(repository);
}
