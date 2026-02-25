import { PrismaCalendarEventsRepository } from '@/repositories/calendar/prisma/prisma-calendar-events-repository';
import { CalendarSyncService } from './calendar-sync.service';

export function makeCalendarSyncService() {
  return new CalendarSyncService(new PrismaCalendarEventsRepository());
}
