import { PrismaAbsencesRepository } from '@/repositories/hr/prisma/prisma-absences-repository';
import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { PrismaVacationPeriodsRepository } from '@/repositories/hr/prisma/prisma-vacation-periods-repository';
import { RequestVacationUseCase } from '../request-vacation';

export function makeRequestVacationUseCase(): RequestVacationUseCase {
  const absencesRepository = new PrismaAbsencesRepository();
  const employeesRepository = new PrismaEmployeesRepository();
  const vacationPeriodsRepository = new PrismaVacationPeriodsRepository();

  return new RequestVacationUseCase(
    absencesRepository,
    employeesRepository,
    vacationPeriodsRepository,
  );
}
