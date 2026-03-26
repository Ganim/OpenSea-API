import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { PrismaTerminationsRepository } from '@/repositories/hr/prisma/prisma-terminations-repository';
import { CreateTerminationUseCase } from '../create-termination';

export function makeCreateTerminationUseCase() {
  const terminationsRepository = new PrismaTerminationsRepository();
  const employeesRepository = new PrismaEmployeesRepository();
  return new CreateTerminationUseCase(
    terminationsRepository,
    employeesRepository,
  );
}
