import { PrismaCalendarsRepository } from '@/repositories/calendar/prisma/prisma-calendars-repository';
import { EnsureSystemCalendarsUseCase } from '../ensure-system-calendars';

export function makeEnsureSystemCalendarsUseCase() {
  const repository = new PrismaCalendarsRepository();
  return new EnsureSystemCalendarsUseCase(repository);
}
