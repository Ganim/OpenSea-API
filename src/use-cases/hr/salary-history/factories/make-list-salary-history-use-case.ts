import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { PrismaSalaryHistoryRepository } from '@/repositories/hr/prisma/prisma-salary-history-repository';
import { ListSalaryHistoryUseCase } from '../list-salary-history';

export function makeListSalaryHistoryUseCase(): ListSalaryHistoryUseCase {
  const salaryHistoryRepository = new PrismaSalaryHistoryRepository();
  const employeesRepository = new PrismaEmployeesRepository();

  return new ListSalaryHistoryUseCase(
    salaryHistoryRepository,
    employeesRepository,
  );
}
