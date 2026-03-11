import { PrismaVacationPeriodsRepository } from '@/repositories/hr/prisma/prisma-vacation-periods-repository';
import { ExpireVacationPeriodsUseCase } from '../expire-vacation-periods';

export function makeExpireVacationPeriodsUseCase(): ExpireVacationPeriodsUseCase {
  const vacationPeriodsRepository = new PrismaVacationPeriodsRepository();
  return new ExpireVacationPeriodsUseCase(vacationPeriodsRepository);
}
