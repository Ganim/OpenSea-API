import { PrismaSchedulesRepository } from '@/repositories/production/prisma/prisma-schedules-repository';
import { DeleteScheduleEntryUseCase } from '../delete-schedule-entry';

export function makeDeleteScheduleEntryUseCase() {
  const schedulesRepository = new PrismaSchedulesRepository();
  return new DeleteScheduleEntryUseCase(schedulesRepository);
}
