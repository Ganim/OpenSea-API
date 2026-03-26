import { PrismaVacationPeriodsRepository } from '@/repositories/hr/prisma/prisma-vacation-periods-repository';
import { PrismaVacationSplitsRepository } from '@/repositories/hr/prisma/prisma-vacation-splits-repository';
import { ListVacationSplitsUseCase } from '../list-vacation-splits';

export function makeListVacationSplitsUseCase(): ListVacationSplitsUseCase {
  const vacationPeriodsRepository = new PrismaVacationPeriodsRepository();
  const vacationSplitsRepository = new PrismaVacationSplitsRepository();

  return new ListVacationSplitsUseCase(
    vacationPeriodsRepository,
    vacationSplitsRepository,
  );
}
