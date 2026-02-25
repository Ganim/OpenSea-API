import { PrismaCalendarEventsRepository } from '@/repositories/calendar/prisma/prisma-calendar-events-repository';
import { PrismaEventParticipantsRepository } from '@/repositories/calendar/prisma/prisma-event-participants-repository';
import { GetCalendarEventByIdUseCase } from '../get-calendar-event-by-id';

export function makeGetCalendarEventByIdUseCase() {
  const calendarEventsRepository = new PrismaCalendarEventsRepository();
  const eventParticipantsRepository = new PrismaEventParticipantsRepository();
  return new GetCalendarEventByIdUseCase(calendarEventsRepository, eventParticipantsRepository);
}
