import { PrismaEmployeeWarningsRepository } from '@/repositories/hr/prisma/prisma-employee-warnings-repository';
import { ListWarningsUseCase } from '../list-warnings';

export function makeListWarningsUseCase(): ListWarningsUseCase {
  const warningsRepository = new PrismaEmployeeWarningsRepository();

  return new ListWarningsUseCase(warningsRepository);
}
