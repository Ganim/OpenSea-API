import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { PrismaOneOnOneMeetingsRepository } from '@/repositories/hr/prisma/prisma-one-on-one-meetings-repository';
import { ScheduleOneOnOneUseCase } from '../schedule-one-on-one';

export function makeScheduleOneOnOneUseCase(): ScheduleOneOnOneUseCase {
  return new ScheduleOneOnOneUseCase(
    new PrismaOneOnOneMeetingsRepository(),
    new PrismaEmployeesRepository(),
  );
}
