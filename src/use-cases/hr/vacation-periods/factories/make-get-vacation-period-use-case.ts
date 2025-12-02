import { PrismaVacationPeriodsRepository } from '@/repositories/hr/prisma/prisma-vacation-periods-repository';
import { GetVacationPeriodUseCase } from '../get-vacation-period';

export function makeGetVacationPeriodUseCase(): GetVacationPeriodUseCase {
  const vacationPeriodsRepository = new PrismaVacationPeriodsRepository();

  return new GetVacationPeriodUseCase(vacationPeriodsRepository);
}
