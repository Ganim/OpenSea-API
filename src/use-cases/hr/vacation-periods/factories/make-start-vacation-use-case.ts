import { PrismaVacationPeriodsRepository } from '@/repositories/hr/prisma/prisma-vacation-periods-repository';
import { StartVacationUseCase } from '../start-vacation';

export function makeStartVacationUseCase(): StartVacationUseCase {
  const vacationPeriodsRepository = new PrismaVacationPeriodsRepository();

  return new StartVacationUseCase(vacationPeriodsRepository);
}
