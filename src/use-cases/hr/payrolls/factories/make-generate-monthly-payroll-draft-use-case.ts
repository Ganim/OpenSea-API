import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { PrismaPayrollsRepository } from '@/repositories/hr/prisma/prisma-payrolls-repository';
import { GenerateMonthlyPayrollDraftUseCase } from '../generate-monthly-payroll-draft';

export function makeGenerateMonthlyPayrollDraftUseCase(): GenerateMonthlyPayrollDraftUseCase {
  const employeesRepository = new PrismaEmployeesRepository();
  const payrollsRepository = new PrismaPayrollsRepository();

  return new GenerateMonthlyPayrollDraftUseCase(
    employeesRepository,
    payrollsRepository,
  );
}
