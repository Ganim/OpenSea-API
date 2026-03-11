import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { ReactivateEmployeeUseCase } from '../reactivate-employee';

export function makeReactivateEmployeeUseCase(): ReactivateEmployeeUseCase {
  const employeesRepository = new PrismaEmployeesRepository();
  return new ReactivateEmployeeUseCase(employeesRepository);
}
