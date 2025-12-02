import { PrismaVacationPeriodsRepository } from '@/repositories/hr/prisma/prisma-vacation-periods-repository';
import { ScheduleVacationUseCase } from '../schedule-vacation';

export function makeScheduleVacationUseCase(): ScheduleVacationUseCase {
  const vacationPeriodsRepository = new PrismaVacationPeriodsRepository();

  return new ScheduleVacationUseCase(vacationPeriodsRepository);
}
