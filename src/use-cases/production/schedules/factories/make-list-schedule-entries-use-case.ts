import { PrismaSchedulesRepository } from '@/repositories/production/prisma/prisma-schedules-repository';
import { ListScheduleEntriesUseCase } from '../list-schedule-entries';

export function makeListScheduleEntriesUseCase() {
  const schedulesRepository = new PrismaSchedulesRepository();
  return new ListScheduleEntriesUseCase(schedulesRepository);
}
