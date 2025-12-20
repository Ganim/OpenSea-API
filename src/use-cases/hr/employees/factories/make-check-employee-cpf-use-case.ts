import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { CheckEmployeeCpfUseCase } from '../check-employee-cpf';

export function makeCheckEmployeeCpfUseCase() {
  const employeesRepository = new PrismaEmployeesRepository();
  return new CheckEmployeeCpfUseCase(employeesRepository);
}
