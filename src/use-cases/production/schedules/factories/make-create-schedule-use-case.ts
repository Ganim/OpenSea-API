import { PrismaSchedulesRepository } from '@/repositories/production/prisma/prisma-schedules-repository';
import { CreateScheduleUseCase } from '../create-schedule';

export function makeCreateScheduleUseCase() {
  const schedulesRepository = new PrismaSchedulesRepository();
  return new CreateScheduleUseCase(schedulesRepository);
}
