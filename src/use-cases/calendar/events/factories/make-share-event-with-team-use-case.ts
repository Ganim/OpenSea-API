import { PrismaCalendarEventsRepository } from '@/repositories/calendar/prisma/prisma-calendar-events-repository';
import { PrismaEventParticipantsRepository } from '@/repositories/calendar/prisma/prisma-event-participants-repository';
import { PrismaCalendarsRepository } from '@/repositories/calendar/prisma/prisma-calendars-repository';
import { PrismaTeamCalendarConfigsRepository } from '@/repositories/calendar/prisma/prisma-team-calendar-configs-repository';
import { PrismaTeamMembersRepository } from '@/repositories/core/prisma/prisma-team-members-repository';
import { ShareEventWithTeamUseCase } from '../share-event-with-team';

export function makeShareEventWithTeamUseCase() {
  return new ShareEventWithTeamUseCase(
    new PrismaCalendarEventsRepository(),
    new PrismaEventParticipantsRepository(),
    new PrismaCalendarsRepository(),
    new PrismaTeamCalendarConfigsRepository(),
    new PrismaTeamMembersRepository(),
  );
}
