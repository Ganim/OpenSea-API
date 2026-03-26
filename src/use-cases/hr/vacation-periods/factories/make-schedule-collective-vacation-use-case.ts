import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { PrismaVacationPeriodsRepository } from '@/repositories/hr/prisma/prisma-vacation-periods-repository';
import { PrismaVacationSplitsRepository } from '@/repositories/hr/prisma/prisma-vacation-splits-repository';
import { ScheduleCollectiveVacationUseCase } from '../schedule-collective-vacation';

export function makeScheduleCollectiveVacationUseCase(): ScheduleCollectiveVacationUseCase {
  const employeesRepository = new PrismaEmployeesRepository();
  const vacationPeriodsRepository = new PrismaVacationPeriodsRepository();
  const vacationSplitsRepository = new PrismaVacationSplitsRepository();

  return new ScheduleCollectiveVacationUseCase(
    employeesRepository,
    vacationPeriodsRepository,
    vacationSplitsRepository,
  );
}
