import { PrismaDependantsRepository } from '@/repositories/hr/prisma/prisma-dependants-repository';
import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { CreateDependantUseCase } from '../create-dependant';

export function makeCreateDependantUseCase() {
  const dependantsRepository = new PrismaDependantsRepository();
  const employeesRepository = new PrismaEmployeesRepository();
  return new CreateDependantUseCase(dependantsRepository, employeesRepository);
}
