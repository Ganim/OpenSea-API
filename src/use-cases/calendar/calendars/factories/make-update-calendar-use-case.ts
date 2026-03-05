import { PrismaCalendarsRepository } from '@/repositories/calendar/prisma/prisma-calendars-repository';
import { PrismaTeamCalendarConfigsRepository } from '@/repositories/calendar/prisma/prisma-team-calendar-configs-repository';
import { UpdateCalendarUseCase } from '../update-calendar';

export function makeUpdateCalendarUseCase() {
  const repository = new PrismaCalendarsRepository();
  const teamCalendarConfigsRepository =
    new PrismaTeamCalendarConfigsRepository();
  return new UpdateCalendarUseCase(repository, teamCalendarConfigsRepository);
}
