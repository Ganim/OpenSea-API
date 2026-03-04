import { PrismaCalendarsRepository } from '@/repositories/calendar/prisma/prisma-calendars-repository';
import { PrismaTeamCalendarConfigsRepository } from '@/repositories/calendar/prisma/prisma-team-calendar-configs-repository';
import { CreateTeamCalendarUseCase } from '../create-team-calendar';

export function makeCreateTeamCalendarUseCase() {
  const calendarsRepository = new PrismaCalendarsRepository();
  const teamCalendarConfigsRepository =
    new PrismaTeamCalendarConfigsRepository();
  return new CreateTeamCalendarUseCase(
    calendarsRepository,
    teamCalendarConfigsRepository,
  );
}
