import { PrismaVacationPeriodsRepository } from '@/repositories/hr/prisma/prisma-vacation-periods-repository';
import { SellVacationDaysUseCase } from '../sell-vacation-days';

export function makeSellVacationDaysUseCase(): SellVacationDaysUseCase {
  const vacationPeriodsRepository = new PrismaVacationPeriodsRepository();

  return new SellVacationDaysUseCase(vacationPeriodsRepository);
}
