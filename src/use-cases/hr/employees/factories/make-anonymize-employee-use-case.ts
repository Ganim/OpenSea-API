import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { AnonymizeEmployeeUseCase } from '../anonymize-employee';

export function makeAnonymizeEmployeeUseCase(): AnonymizeEmployeeUseCase {
  const employeesRepository = new PrismaEmployeesRepository();
  return new AnonymizeEmployeeUseCase(employeesRepository);
}
