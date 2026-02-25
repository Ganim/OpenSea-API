import { PrismaCalendarEventsRepository } from '@/repositories/calendar/prisma/prisma-calendar-events-repository';
import { PrismaEventParticipantsRepository } from '@/repositories/calendar/prisma/prisma-event-participants-repository';
import { PrismaEventRemindersRepository } from '@/repositories/calendar/prisma/prisma-event-reminders-repository';
import { ManageRemindersUseCase } from '../manage-reminders';

export function makeManageRemindersUseCase() {
  return new ManageRemindersUseCase(
    new PrismaCalendarEventsRepository(),
    new PrismaEventParticipantsRepository(),
    new PrismaEventRemindersRepository(),
  );
}
