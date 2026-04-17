import { PrismaAbsencesRepository } from '@/repositories/hr/prisma/prisma-absences-repository';
import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { PrismaTerminationsRepository } from '@/repositories/hr/prisma/prisma-terminations-repository';
import { PrismaVacationPeriodsRepository } from '@/repositories/hr/prisma/prisma-vacation-periods-repository';
import { CalculateTerminationPaymentUseCase } from '../calculate-termination-payment';

export function makeCalculateTerminationPaymentUseCase() {
  const terminationsRepository = new PrismaTerminationsRepository();
  const employeesRepository = new PrismaEmployeesRepository();
  const vacationPeriodsRepository = new PrismaVacationPeriodsRepository();
  const absencesRepository = new PrismaAbsencesRepository();

  return new CalculateTerminationPaymentUseCase(
    terminationsRepository,
    employeesRepository,
    vacationPeriodsRepository,
    absencesRepository,
  );
}
