import { PrismaCalendarEventsRepository } from '@/repositories/calendar/prisma/prisma-calendar-events-repository';
import { CreateCalendarEventUseCase } from '../create-calendar-event';

export function makeCreateCalendarEventUseCase() {
  const repository = new PrismaCalendarEventsRepository();
  return new CreateCalendarEventUseCase(repository);
}
