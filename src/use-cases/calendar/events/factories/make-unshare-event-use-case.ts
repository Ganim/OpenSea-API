import { PrismaCalendarEventsRepository } from '@/repositories/calendar/prisma/prisma-calendar-events-repository';
import { PrismaEventParticipantsRepository } from '@/repositories/calendar/prisma/prisma-event-participants-repository';
import { PrismaCalendarsRepository } from '@/repositories/calendar/prisma/prisma-calendars-repository';
import { PrismaTeamCalendarConfigsRepository } from '@/repositories/calendar/prisma/prisma-team-calendar-configs-repository';
import { UnshareEventUseCase } from '../unshare-event';

export function makeUnshareEventUseCase() {
  return new UnshareEventUseCase(
    new PrismaCalendarEventsRepository(),
    new PrismaEventParticipantsRepository(),
    new PrismaCalendarsRepository(),
    new PrismaTeamCalendarConfigsRepository(),
  );
}
