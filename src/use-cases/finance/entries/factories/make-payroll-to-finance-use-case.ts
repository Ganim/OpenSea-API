import { PrismaFinanceCategoriesRepository } from '@/repositories/finance/prisma/prisma-finance-categories-repository';
import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { PrismaPayrollItemsRepository } from '@/repositories/hr/prisma/prisma-payroll-items-repository';
import { PrismaPayrollsRepository } from '@/repositories/hr/prisma/prisma-payrolls-repository';
import { PayrollToFinanceUseCase } from '../payroll-to-finance';

export function makePayrollToFinanceUseCase() {
  const payrollsRepository = new PrismaPayrollsRepository();
  const payrollItemsRepository = new PrismaPayrollItemsRepository();
  const employeesRepository = new PrismaEmployeesRepository();
  const financeEntriesRepository = new PrismaFinanceEntriesRepository();
  const financeCategoriesRepository = new PrismaFinanceCategoriesRepository();

  return new PayrollToFinanceUseCase(
    payrollsRepository,
    payrollItemsRepository,
    employeesRepository,
    financeEntriesRepository,
    financeCategoriesRepository,
  );
}
