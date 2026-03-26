import { PrismaVacationPeriodsRepository } from '@/repositories/hr/prisma/prisma-vacation-periods-repository';
import { UpdateVacationPeriodUseCase } from '../update-vacation-period';

export function makeUpdateVacationPeriodUseCase(): UpdateVacationPeriodUseCase {
  const vacationPeriodsRepository = new PrismaVacationPeriodsRepository();
  return new UpdateVacationPeriodUseCase(vacationPeriodsRepository);
}
