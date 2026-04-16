import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { PrismaVacationPeriodsRepository } from '@/repositories/hr/prisma/prisma-vacation-periods-repository';
import { RunVacationAccrualUseCase } from '../run-vacation-accrual';

export function makeRunVacationAccrualUseCase(): RunVacationAccrualUseCase {
  const employeesRepository = new PrismaEmployeesRepository();
  const vacationPeriodsRepository = new PrismaVacationPeriodsRepository();

  return new RunVacationAccrualUseCase(
    employeesRepository,
    vacationPeriodsRepository,
  );
}
