import { PrismaCalendarsRepository } from '@/repositories/calendar/prisma/prisma-calendars-repository';
import { CreatePersonalCalendarUseCase } from '../create-personal-calendar';

export function makeCreatePersonalCalendarUseCase() {
  const repository = new PrismaCalendarsRepository();
  return new CreatePersonalCalendarUseCase(repository);
}
