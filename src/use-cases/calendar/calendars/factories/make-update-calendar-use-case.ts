import { PrismaCalendarsRepository } from '@/repositories/calendar/prisma/prisma-calendars-repository';
import { UpdateCalendarUseCase } from '../update-calendar';

export function makeUpdateCalendarUseCase() {
  const repository = new PrismaCalendarsRepository();
  return new UpdateCalendarUseCase(repository);
}
