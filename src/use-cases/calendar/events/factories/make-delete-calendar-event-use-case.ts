import { PrismaCalendarEventsRepository } from '@/repositories/calendar/prisma/prisma-calendar-events-repository';
import { DeleteCalendarEventUseCase } from '../delete-calendar-event';

export function makeDeleteCalendarEventUseCase() {
  const repository = new PrismaCalendarEventsRepository();
  return new DeleteCalendarEventUseCase(repository);
}
