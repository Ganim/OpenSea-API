import { PrismaTeamCalendarConfigsRepository } from '@/repositories/calendar/prisma/prisma-team-calendar-configs-repository';
import { UpdateTeamCalendarPermissionsUseCase } from '../update-team-calendar-permissions';

export function makeUpdateTeamCalendarPermissionsUseCase() {
  const repository = new PrismaTeamCalendarConfigsRepository();
  return new UpdateTeamCalendarPermissionsUseCase(repository);
}
