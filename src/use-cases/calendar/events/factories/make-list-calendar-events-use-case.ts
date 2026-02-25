import { PrismaCalendarEventsRepository } from '@/repositories/calendar/prisma/prisma-calendar-events-repository';
import { ListCalendarEventsUseCase } from '../list-calendar-events';

export function makeListCalendarEventsUseCase() {
  const repository = new PrismaCalendarEventsRepository();
  return new ListCalendarEventsUseCase(repository);
}
