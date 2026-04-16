import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { PrismaSalaryHistoryRepository } from '@/repositories/hr/prisma/prisma-salary-history-repository';
import { RegisterSalaryChangeUseCase } from '../register-salary-change';

export function makeRegisterSalaryChangeUseCase(): RegisterSalaryChangeUseCase {
  const salaryHistoryRepository = new PrismaSalaryHistoryRepository();
  const employeesRepository = new PrismaEmployeesRepository();

  return new RegisterSalaryChangeUseCase(
    salaryHistoryRepository,
    employeesRepository,
  );
}
