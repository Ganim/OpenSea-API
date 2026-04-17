import { PrismaCipaMembersRepository } from '@/repositories/hr/prisma/prisma-cipa-members-repository';
import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { PrismaTerminationsRepository } from '@/repositories/hr/prisma/prisma-terminations-repository';
import { CreateTerminationUseCase } from '../create-termination';

export function makeCreateTerminationUseCase() {
  const terminationsRepository = new PrismaTerminationsRepository();
  const employeesRepository = new PrismaEmployeesRepository();
  const cipaMembersRepository = new PrismaCipaMembersRepository();
  return new CreateTerminationUseCase(
    terminationsRepository,
    employeesRepository,
    cipaMembersRepository,
  );
}
