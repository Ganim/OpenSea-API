import { PrismaSchedulesRepository } from '@/repositories/production/prisma/prisma-schedules-repository';
import { CreateScheduleEntryUseCase } from '../create-schedule-entry';

export function makeCreateScheduleEntryUseCase() {
  const schedulesRepository = new PrismaSchedulesRepository();
  return new CreateScheduleEntryUseCase(schedulesRepository);
}
