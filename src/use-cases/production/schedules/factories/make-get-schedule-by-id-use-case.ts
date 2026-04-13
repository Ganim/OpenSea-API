import { PrismaSchedulesRepository } from '@/repositories/production/prisma/prisma-schedules-repository';
import { GetScheduleByIdUseCase } from '../get-schedule-by-id';

export function makeGetScheduleByIdUseCase() {
  const schedulesRepository = new PrismaSchedulesRepository();
  return new GetScheduleByIdUseCase(schedulesRepository);
}
