import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { SuspendEmployeeUseCase } from '../suspend-employee';

export function makeSuspendEmployeeUseCase(): SuspendEmployeeUseCase {
  const employeesRepository = new PrismaEmployeesRepository();
  return new SuspendEmployeeUseCase(employeesRepository);
}
