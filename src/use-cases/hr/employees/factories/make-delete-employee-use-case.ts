import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { DeleteEmployeeUseCase } from '../delete-employee';

export function makeDeleteEmployeeUseCase() {
  const employeesRepository = new PrismaEmployeesRepository();
  return new DeleteEmployeeUseCase(employeesRepository);
}
