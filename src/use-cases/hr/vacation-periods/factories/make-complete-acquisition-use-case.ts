import { PrismaVacationPeriodsRepository } from '@/repositories/hr/prisma/prisma-vacation-periods-repository';
import { CompleteAcquisitionUseCase } from '../complete-acquisition';

export function makeCompleteAcquisitionUseCase(): CompleteAcquisitionUseCase {
  const vacationPeriodsRepository = new PrismaVacationPeriodsRepository();
  return new CompleteAcquisitionUseCase(vacationPeriodsRepository);
}
