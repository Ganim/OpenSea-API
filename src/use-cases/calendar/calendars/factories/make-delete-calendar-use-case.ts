import { PrismaCalendarsRepository } from '@/repositories/calendar/prisma/prisma-calendars-repository';
import { DeleteCalendarUseCase } from '../delete-calendar';

export function makeDeleteCalendarUseCase() {
  const repository = new PrismaCalendarsRepository();
  return new DeleteCalendarUseCase(repository);
}
