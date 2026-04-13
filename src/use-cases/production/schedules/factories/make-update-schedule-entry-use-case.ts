import { PrismaSchedulesRepository } from '@/repositories/production/prisma/prisma-schedules-repository';
import { UpdateScheduleEntryUseCase } from '../update-schedule-entry';

export function makeUpdateScheduleEntryUseCase() {
  const schedulesRepository = new PrismaSchedulesRepository();
  return new UpdateScheduleEntryUseCase(schedulesRepository);
}
