import { PrismaVacationPeriodsRepository } from '@/repositories/hr/prisma/prisma-vacation-periods-repository';
import { CancelScheduledVacationUseCase } from '../cancel-scheduled-vacation';

export function makeCancelScheduledVacationUseCase(): CancelScheduledVacationUseCase {
  const vacationPeriodsRepository = new PrismaVacationPeriodsRepository();

  return new CancelScheduledVacationUseCase(vacationPeriodsRepository);
}
