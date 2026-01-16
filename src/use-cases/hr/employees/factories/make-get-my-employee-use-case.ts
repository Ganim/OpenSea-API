import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { GetMyEmployeeUseCase } from '../get-my-employee';

export function makeGetMyEmployeeUseCase(): GetMyEmployeeUseCase {
  const employeesRepository = new PrismaEmployeesRepository();
  return new GetMyEmployeeUseCase(employeesRepository);
}
