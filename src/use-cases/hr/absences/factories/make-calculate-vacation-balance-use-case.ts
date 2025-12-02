import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { PrismaVacationPeriodsRepository } from '@/repositories/hr/prisma/prisma-vacation-periods-repository';
import { CalculateVacationBalanceUseCase } from '../calculate-vacation-balance';

export function makeCalculateVacationBalanceUseCase(): CalculateVacationBalanceUseCase {
  const employeesRepository = new PrismaEmployeesRepository();
  const vacationPeriodsRepository = new PrismaVacationPeriodsRepository();

  return new CalculateVacationBalanceUseCase(
    employeesRepository,
    vacationPeriodsRepository,
  );
}
