import { PrismaSchedulesRepository } from '@/repositories/production/prisma/prisma-schedules-repository';
import { DeleteScheduleUseCase } from '../delete-schedule';

export function makeDeleteScheduleUseCase() {
  const schedulesRepository = new PrismaSchedulesRepository();
  return new DeleteScheduleUseCase(schedulesRepository);
}
