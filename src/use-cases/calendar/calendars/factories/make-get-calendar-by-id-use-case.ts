import { PrismaCalendarsRepository } from '@/repositories/calendar/prisma/prisma-calendars-repository';
import { PrismaTeamCalendarConfigsRepository } from '@/repositories/calendar/prisma/prisma-team-calendar-configs-repository';
import { GetCalendarByIdUseCase } from '../get-calendar-by-id';

export function makeGetCalendarByIdUseCase() {
  return new GetCalendarByIdUseCase(
    new PrismaCalendarsRepository(),
    new PrismaTeamCalendarConfigsRepository(),
  );
}
