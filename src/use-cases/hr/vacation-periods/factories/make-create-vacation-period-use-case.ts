import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { PrismaVacationPeriodsRepository } from '@/repositories/hr/prisma/prisma-vacation-periods-repository';
import { CreateVacationPeriodUseCase } from '../create-vacation-period';

export function makeCreateVacationPeriodUseCase(): CreateVacationPeriodUseCase {
  const employeesRepository = new PrismaEmployeesRepository();
  const vacationPeriodsRepository = new PrismaVacationPeriodsRepository();

  return new CreateVacationPeriodUseCase(
    employeesRepository,
    vacationPeriodsRepository,
  );
}
