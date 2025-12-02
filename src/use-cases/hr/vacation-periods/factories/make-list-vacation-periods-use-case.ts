import { PrismaVacationPeriodsRepository } from '@/repositories/hr/prisma/prisma-vacation-periods-repository';
import { ListVacationPeriodsUseCase } from '../list-vacation-periods';

export function makeListVacationPeriodsUseCase(): ListVacationPeriodsUseCase {
  const vacationPeriodsRepository = new PrismaVacationPeriodsRepository();

  return new ListVacationPeriodsUseCase(vacationPeriodsRepository);
}
