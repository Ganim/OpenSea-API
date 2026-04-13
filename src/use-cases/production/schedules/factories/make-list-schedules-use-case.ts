import { PrismaSchedulesRepository } from '@/repositories/production/prisma/prisma-schedules-repository';
import { ListSchedulesUseCase } from '../list-schedules';

export function makeListSchedulesUseCase() {
  const schedulesRepository = new PrismaSchedulesRepository();
  return new ListSchedulesUseCase(schedulesRepository);
}
