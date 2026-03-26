import { PrismaVacationPeriodsRepository } from '@/repositories/hr/prisma/prisma-vacation-periods-repository';
import { PrismaVacationSplitsRepository } from '@/repositories/hr/prisma/prisma-vacation-splits-repository';
import { ScheduleVacationSplitUseCase } from '../schedule-vacation-split';

export function makeScheduleVacationSplitUseCase(): ScheduleVacationSplitUseCase {
  const vacationPeriodsRepository = new PrismaVacationPeriodsRepository();
  const vacationSplitsRepository = new PrismaVacationSplitsRepository();

  return new ScheduleVacationSplitUseCase(
    vacationPeriodsRepository,
    vacationSplitsRepository,
  );
}
