import { PrismaVacationPeriodsRepository } from '@/repositories/hr/prisma/prisma-vacation-periods-repository';
import { CompleteVacationUseCase } from '../complete-vacation';

export function makeCompleteVacationUseCase(): CompleteVacationUseCase {
  const vacationPeriodsRepository = new PrismaVacationPeriodsRepository();

  return new CompleteVacationUseCase(vacationPeriodsRepository);
}
