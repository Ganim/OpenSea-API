import { PrismaCalendarsRepository } from '@/repositories/calendar/prisma/prisma-calendars-repository';
import { PrismaTeamCalendarConfigsRepository } from '@/repositories/calendar/prisma/prisma-team-calendar-configs-repository';
import { ListMyCalendarsUseCase } from '../list-my-calendars';

export function makeListMyCalendarsUseCase() {
  const calendarsRepository = new PrismaCalendarsRepository();
  const teamCalendarConfigsRepository =
    new PrismaTeamCalendarConfigsRepository();
  return new ListMyCalendarsUseCase(
    calendarsRepository,
    teamCalendarConfigsRepository,
  );
}
